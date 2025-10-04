const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApprovalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approved: { type: Boolean, required: true },
  comment: { type: String, default: '' },
  time: { type: Date, default: Date.now }
}, { _id: false });

const ReceiptSchema = new Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  ocrText: { type: String, default: '' },
  ocrData: {
    amount: Number,
    date: Date,
    merchant: String,
    items: [String]
  }
}, { _id: false });

const ExpenseSchema = new Schema({
  description: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paidBy: { type: String, enum: ['Cash', 'Card', 'Company'], default: 'Cash' },
  remarks: { type: String, default: '' },
  expenseDate: { type: Date, required: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt: { type: Date },
  status: { type: String, enum: ['Draft','WaitingApproval','Approved','Rejected','Cancelled'], default: 'Draft' },

  // Approval workflow
  approvers: [{ type: Schema.Types.ObjectId, ref: 'User' }], // ordered list
  approvals: [ApprovalSchema],
  currentApproverIndex: { type: Number, default: 0 },
  isManagerApprover: { type: Boolean, default: true },
  approvalSequence: { type: Boolean, default: true }, // true = sequential, false = parallel
  minApprovalPercentage: { type: Number, default: 100 },

  // Currency conversion
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  companyCurrency: { type: String }, // e.g., "INR"
  amountInCompanyCurrency: { type: Number },
  exchangeRateUsed: { type: Number },
  exchangeRateDate: { type: Date },

  // Receipts and OCR
  receipts: [ReceiptSchema],

  // Auditing
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ExpenseSchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Expense', ExpenseSchema);
