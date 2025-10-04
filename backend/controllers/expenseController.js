const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const Rule = require('../models/Rule');
const currencyService = require('../utils/currencyService');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// create expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, date, approvers } = req.body;
    const receipts = (req.files || []).map(f => f.path);

    // compute company currency conversion
    const company = await Company.findById(req.user.companyId);
    let amountInCompanyCurrency = amount;
    try {
      amountInCompanyCurrency = await currencyService.convertToCompanyCurrency(
        Number(amount), currency, company.defaultCurrency
      );
    } catch (e) {
      // fallback: keep original amount in amountInCompanyCurrency
    }

    // build approver sequence (normalize to strings)
    const approverSet = new Set();
    const user = await User.findById(req.user.id);

    // 1) if user has manager approver
    if (user && user.isManagerApprover && user.managerId) approverSet.add(String(user.managerId));

    // 2) explicit approvers passed in request (support JSON string or array)
    if (approvers) {
      let parsed = [];
      try {
        parsed = typeof approvers === 'string' ? JSON.parse(approvers) : approvers;
      } catch (e) {
        parsed = Array.isArray(approvers) ? approvers : [];
      }
      (parsed || []).forEach(a => {
        if (a) approverSet.add(String(a));
      });
    }

    // 3) fallback: all managers in company
    if (approverSet.size === 0) {
      const managers = await User.find({ companyId: req.user.companyId, role: 'Manager' }).select('_id');
      if (managers && managers.length > 0) {
        managers.forEach(m => approverSet.add(String(m._id)));
      }
    }

    // 4) final fallback: company createdBy or any admin in company or request creator
    if (approverSet.size === 0) {
      // prefer company.createdBy if set
      const fallback = (company && company.createdBy) ? String(company.createdBy) : null;
      if (fallback) {
        approverSet.add(fallback);
      } else {
        // find an admin in the company
        const admins = await User.find({ companyId: req.user.companyId, role: 'Admin' }).limit(1).select('_id');
        if (admins && admins.length > 0) approverSet.add(String(admins[0]._id));
        else approverSet.add(String(req.user.id)); // last resort: the creator themselves
      }
    }

    // convert set to array of IDs (strings are OK; Mongoose will cast)
    const approverIds = Array.from(approverSet);

    const expense = new Expense({
      userId: req.user.id,
      companyId: req.user.companyId,
      amount: Number(amount),
      currency,
      amountInCompanyCurrency,
      category,
      description,
      date: date || Date.now(),
      receipts,
      approvers: approverIds,
      // explicit defaults to be safe
      currentApproverIndex: 0,
      status: 'Pending'
    });

    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error('createExpense error:', err);
    res.status(500).json({ error: err.message });
  }
};


// OCR receipt parsing
exports.ocrReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const filePath = req.file.path;

    // use tesseract to recognize text (may be slow)
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();

    // naive parsing to find an amount and date
    let amount = null;
    const amountMatch = text.match(/(?:Rs\.?|₹|\$|USD|EUR)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (amountMatch) amount = parseFloat(amountMatch[1]);

    let date = null;
    const dateMatch = text.match(/([0-3]?\d[\/\-\.\s][0-1]?\d[\/\-\.\s](?:\d{2}|\d{4}))/);
    if (dateMatch) date = dateMatch[1];

    // merchant (first non-empty line)
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    const merchant = lines.length ? lines[0] : null;

    // cleanup temp file
    try { fs.unlinkSync(filePath); } catch (e) {}

    res.json({ text, parsed: { amount, date, merchant } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// list expenses - optional pendingForMe=true
exports.listExpenses = async (req, res) => {
  try {
    const { pendingForMe } = req.query;

    if (pendingForMe === 'true') {
      // first: find all pending expenses where this user is among approvers
      const all = await Expense.find({
        status: 'Pending',
        approvers: { $in: [req.user.id] }
      })
      .populate('userId', 'name email')
      .lean();

      // then filter to only those where the current approver (by index) is this user
      const filtered = all.filter(e => {
        // ensure approvers is an array and currentApproverIndex is a number
        const approvers = Array.isArray(e.approvers) ? e.approvers : [];
        const idx = (typeof e.currentApproverIndex === 'number') ? e.currentApproverIndex : 0;
        return approvers[idx] && String(approvers[idx]) === String(req.user.id);
      });

      return res.json(filtered);
    } else {
      // list all company expenses (admins/managers) or own expenses for employee
      if (req.user.role === 'Admin' || req.user.role === 'Manager') {
        const all = await Expense.find({ companyId: req.user.companyId })
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .lean();
        return res.json(all);
      } else {
        const mine = await Expense.find({ userId: req.user.id })
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .lean();
        return res.json(mine);
      }
    }
  } catch (err) {
    console.error('listExpenses error:', err);
    res.status(500).json({ error: err.message });
  }
};

async function evaluateRulesAndFinalize(expense) {
  // fetch rule for company
  const rule = await Rule.findOne({ companyId: expense.companyId });
  if (!rule) return false; // no rule => continue sequence

  if (rule.type === 'percentage') {
    const threshold = rule.settings.threshold || 0.6;
    const approvals = expense.approvals.filter(a => a.approved).length;
    const required = Math.ceil(expense.approvers.length * threshold);
    if (approvals >= required) {
      expense.status = 'Approved';
      return true;
    }
    return false;
  } else if (rule.type === 'specific') {
    const approverId = rule.settings.approverId;
    const found = expense.approvals.find(a => String(a.userId) === String(approverId) && a.approved);
    if (found) {
      expense.status = 'Approved';
      return true;
    }
    return false;
  } else if (rule.type === 'hybrid') {
    const threshold = rule.settings.threshold || 0.6;
    const approverId = rule.settings.approverId;
    const approvals = expense.approvals.filter(a => a.approved).length;
    const required = Math.ceil(expense.approvers.length * threshold);
    if (approvals >= required) {
      expense.status = 'Approved';
      return true;
    }
    const found = expense.approvals.find(a => String(a.userId) === String(approverId) && a.approved);
    if (found) {
      expense.status = 'Approved';
      return true;
    }
    return false;
  }
  return false;
}

// approve an expense
exports.approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ error: 'not found' });

    // verify current approver
    const idx = expense.currentApproverIndex || 0;
    if (String(expense.approvers[idx]) !== String(req.user.id) && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not your turn to approve' });
    }

    expense.approvals.push({ userId: req.user.id, approved: true, comment });
    // evaluate rules
    const finalized = await evaluateRulesAndFinalize(expense);
    if (!finalized) {
      // move to next approver if present
      if (idx + 1 < expense.approvers.length) {
        expense.currentApproverIndex = idx + 1;
      } else {
        // if no more approvers and no rule finalized -> mark approved
        expense.status = 'Approved';
      }
    }
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// reject an expense
exports.rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ error: 'not found' });

    const idx = expense.currentApproverIndex || 0;
    if (String(expense.approvers[idx]) !== String(req.user.id) && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not your turn to reject' });
    }

    expense.approvals.push({ userId: req.user.id, approved: false, comment });
    expense.status = 'Rejected';
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};