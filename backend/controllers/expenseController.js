const Expense = require('../models/Expense');
const Rule = require('../models/Rule');
const User = require('../models/User');
const Company = require('../models/Company');
const { convertToCompanyCurrency } = require('../utils/currencyService');
const tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

function emitToUser(io, userId, event, payload) {
  if (!io) return;
  io.to(userId.toString()).emit(event, payload);
}

function checkApprovalCompletion(expense) {
  const approvals = expense.approvals || [];
  const approvers = expense.approvers || [];
  
  if (approvals.length === 0) {
    return { complete: false, approved: false };
  }

  // Check for any rejection
  const hasRejection = approvals.some(approval => !approval.approved);
  if (hasRejection) {
    return { complete: true, approved: false };
  }

  if (expense.approvalSequence) {
    // Sequential approval - all approvers must approve
    const approvedCount = approvals.filter(approval => approval.approved).length;
    return { 
      complete: approvedCount >= approvers.length, 
      approved: approvedCount >= approvers.length 
    };
  } else {
    // Parallel approval - check percentage
    const approvedCount = approvals.filter(approval => approval.approved).length;
    const requiredCount = Math.ceil((approvers.length * expense.minApprovalPercentage) / 100);
    return { 
      complete: approvedCount >= requiredCount, 
      approved: approvedCount >= requiredCount 
    };
  }
}

exports.createExpense = async (req, res) => {
  try {
    const { 
      description, 
      category, 
      amount, 
      currency, 
      paidBy, 
      remarks, 
      expenseDate 
    } = req.body;
    
    const submittedBy = req.user._id;
    const companyId = req.user.companyId;
    
    const expense = new Expense({
      description, 
      category, 
      amount,
      currency, 
      paidBy, 
      remarks,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      submittedBy,
      companyId,
      status: 'Draft'
    });
    
    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol');
    
    res.json(populatedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitExpense = async (req, res) => {
  try {
    console.log('Submit expense request:', req.params.id, 'User:', req.user._id);
    const id = req.params.id;
    const expense = await Expense.findById(id).populate('companyId');
    if (!expense) {
      console.log('Expense not found:', id);
      return res.status(404).json({ error: 'Expense not found' });
    }
    if (expense.submittedBy.toString() !== req.user._id.toString()) {
      console.log('Not authorized - user mismatch');
      return res.status(403).json({ error: 'Not authorized' });
    }

    console.log('Expense found:', expense.description, 'Amount:', expense.amount);

    // Get approval rules for this user
    const rules = await Rule.find({ 
      userId: req.user._id, 
      companyId: expense.companyId._id,
      isActive: true,
      amountThreshold: { $lte: expense.amount }
    }).sort({ amountThreshold: -1 });

    console.log('Found rules:', rules.length);

    let selectedRule = rules[0]; // Get the rule with highest threshold that applies
    
    if (!selectedRule) {
      console.log('No rules found, using default rule');
      // Default rule: manager approval only
      selectedRule = {
        isManagerApprover: true,
        approvers: [],
        approvalSequence: true,
        minApprovalPercentage: 100
      };
    }

    // Set up approval workflow
    expense.isManagerApprover = selectedRule.isManagerApprover;
    expense.approvers = selectedRule.approvers || [];
    expense.approvalSequence = selectedRule.approvalSequence;
    expense.minApprovalPercentage = selectedRule.minApprovalPercentage;

    console.log('User managerId:', req.user.managerId);
    console.log('IsManagerApprover:', expense.isManagerApprover);

    // Add manager as first approver if required
    if (expense.isManagerApprover && req.user.managerId) {
      console.log('Adding manager as approver:', req.user.managerId);
      expense.approvers.unshift(req.user.managerId);
    }

    // Convert currency
    const companyCurrency = expense.companyId.defaultCurrency;
    console.log('Converting currency from', expense.currency, 'to', companyCurrency);
    
    const convertedAmount = await convertToCompanyCurrency(
      expense.amount, 
      expense.currency, 
      companyCurrency
    );
    
    console.log('Converted amount:', convertedAmount);
    
    expense.companyCurrency = companyCurrency;
    expense.amountInCompanyCurrency = convertedAmount;
    expense.exchangeRateDate = new Date();

    expense.status = 'WaitingApproval';
    expense.submittedAt = new Date();
    expense.currentApproverIndex = 0;

    console.log('Saving expense...');
    await expense.save();
    console.log('Expense saved successfully');

    // Notify first approver
    const io = req.app.get('io');
    if (expense.approvers && expense.approvers[0]) {
      emitToUser(io, expense.approvers[0], 'expenseAssigned', expense);
    }
    emitToUser(io, expense.submittedBy, 'expenseUpdated', expense);

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email role')
      .populate('approvers', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol');

    res.json(populatedExpense);
  } catch (err) {
    console.error('Error submitting expense:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { status, approverId, companyId } = req.query;
    const q = {};
    
    if (status) q.status = status;
    if (approverId) q.approvers = approverId;
    if (companyId) q.companyId = companyId;
    
    // Scope by user role and company
    if (req.user.role === 'Admin') {
      // Admin sees all expenses in their company
      q.companyId = req.user.companyId;
    } else if (req.user.role === 'Manager') {
      // Manager sees their own expenses + those assigned to them + their team's expenses
      q.$or = [
        { submittedBy: req.user._id },
        { approvers: req.user._id },
        { 'submittedBy.managerId': req.user._id }
      ];
    } else {
      // Employee sees only their own expenses
      q.submittedBy = req.user._id;
    }
    
    const expenses = await Expense.find(q)
      .populate('submittedBy', 'name email role')
      .populate('approvers', 'name email role')
      .populate('approvals.userId', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol')
      .sort({ createdAt: -1 });
    
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('approvers', 'name email role')
      .populate('approvals.userId', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol');
      
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    // Permission check: owners, approvers, admins allowed
    const isOwner = expense.submittedBy._id.toString() === req.user._id.toString();
    const isApprover = expense.approvers.some(a => a._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'Admin' && expense.companyId._id.toString() === req.user.companyId.toString();
    
    if (!isOwner && !isApprover && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this expense' });
    }
    
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const id = req.params.id;
    const comment = req.body.comment || '';
    const expense = await Expense.findById(id).populate('approvers', 'name email role');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (expense.status !== 'WaitingApproval') return res.status(400).json({ error: 'Not awaiting approval' });

    // Check if user is authorized to approve
    const isAuthorized = req.user.role === 'Admin' || 
      expense.approvers.some(approver => approver._id.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to approve this expense' });
    }

    // Add approval
    expense.approvals.push({ 
      userId: req.user._id, 
      approved: true, 
      comment, 
      time: new Date() 
    });

    // Check if approval is complete
    const approvalResult = checkApprovalCompletion(expense);
    
    if (approvalResult.complete) {
      expense.status = approvalResult.approved ? 'Approved' : 'Rejected';
    } else if (expense.approvalSequence) {
      // Sequential approval - move to next approver
      expense.currentApproverIndex = (expense.currentApproverIndex || 0) + 1;
    }

    await expense.save();

    // Emit events
    const io = req.app.get('io');
    emitToUser(io, expense.submittedBy, 'expenseUpdated', expense);
    
    // Notify next approver if sequential and not complete
    if (expense.status === 'WaitingApproval' && expense.approvalSequence && 
        expense.approvers[expense.currentApproverIndex]) {
      emitToUser(io, expense.approvers[expense.currentApproverIndex], 'expenseAssigned', expense);
    }

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email role')
      .populate('approvers', 'name email role')
      .populate('approvals.userId', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol');

    res.json(populatedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const { comment } = req.body;
    const expense = await Expense.findById(req.params.id).populate('approvers', 'name email role');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    if (expense.status !== 'WaitingApproval') return res.status(400).json({ error: 'Not awaiting approval' });

    // Check if user is authorized to reject
    const isAuthorized = req.user.role === 'Admin' || 
      expense.approvers.some(approver => approver._id.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to reject this expense' });
    }

    expense.approvals.push({ 
      userId: req.user._id, 
      approved: false, 
      comment, 
      time: new Date() 
    });
    expense.status = 'Rejected';
    expense.currentApproverIndex = 0; // Allow resubmit by owner

    await expense.save();
    
    const io = req.app.get('io');
    emitToUser(io, expense.submittedBy, 'expenseUpdated', expense);

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email role')
      .populate('approvers', 'name email role')
      .populate('approvals.userId', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol');

    res.json(populatedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filepath = req.file.path;
    let ocrText = '';
    let ocrData = {};
    
    try {
      const result = await tesseract.recognize(filepath, 'eng');
      ocrText = result.data?.text || '';
      
      // Try to extract structured data from OCR text
      ocrData = extractExpenseData(ocrText);
    } catch (e) {
      console.warn('OCR failed', e.message);
    }

    const url = `/uploads/${req.file.filename}`;
    expense.receipts.push({ 
      url, 
      filename: req.file.filename, 
      ocrText,
      ocrData
    });
    
    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email role')
      .populate('approvers', 'name email role')
      .populate('companyId', 'name defaultCurrency currencySymbol');
    
    res.json({ expense: populatedExpense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to extract expense data from OCR text
function extractExpenseData(ocrText) {
  const data = {
    amount: null,
    date: null,
    merchant: '',
    items: []
  };
  
  // Extract amount (look for currency patterns)
  const amountMatch = ocrText.match(/(?:total|amount|sum)[\s:]*\$?(\d+\.?\d*)/i);
  if (amountMatch) {
    data.amount = parseFloat(amountMatch[1]);
  }
  
  // Extract date (various formats)
  const dateMatch = ocrText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  if (dateMatch) {
    data.date = new Date(dateMatch[1]);
  }
  
  // Extract merchant name (usually at the top)
  const lines = ocrText.split('\n');
  if (lines.length > 0) {
    data.merchant = lines[0].trim();
  }
  
  // Extract items (lines that might be items)
  data.items = lines
    .filter(line => line.trim().length > 0)
    .slice(1, -2) // Skip first line (merchant) and last few lines (total, etc.)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return data;
}
