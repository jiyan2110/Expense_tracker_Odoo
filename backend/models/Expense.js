const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean },
  comment: { type: String },
  at: { type: Date, default: Date.now }
});

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  amount: { type: Number, required: true }, // original amount
  currency: { type: String, required: true }, // original currency code
  amountInCompanyCurrency: { type: Number }, // computed
  category: { type: String },
  description: { type: String },
  date: { type: Date, default: Date.now },
  receipts: [{ type: String }], // file paths or URLs
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // sequence
  currentApproverIndex: { type: Number, default: 0 },
  approvals: [ApprovalSchema],
  meta: { type: Object } // any parsed OCR data, etc.
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
