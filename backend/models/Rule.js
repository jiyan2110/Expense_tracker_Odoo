const mongoose = require('mongoose');
const { Schema } = mongoose;

const RuleSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // User this rule applies to
  name: { type: String, required: true }, // e.g., "Misc expenses"
  description: { type: String, default: '' },
  category: { type: String }, // optional category this rule applies to
  
  // Approval configuration
  isManagerApprover: { type: Boolean, default: true },
  approvers: [{ type: Schema.Types.ObjectId, ref: 'User' }], // ordered list
  approvalSequence: { type: Boolean, default: true }, // true = sequential, false = parallel
  minApprovalPercentage: { type: Number, default: 100 }, // 0-100
  
  // Amount thresholds
  amountThreshold: { type: Number, default: 0 }, // if > threshold, this rule applies
  
  // Status
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Rule', RuleSchema);
