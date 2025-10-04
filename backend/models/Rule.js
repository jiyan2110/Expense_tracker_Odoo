const mongoose = require('mongoose');

/*
 Rule types:
 - percentage: { threshold: 0.6 } // 60%
 - specific: { approverId: ObjectId } // if this approver approves, auto-approved
 - hybrid: { threshold: 0.6, approverId: ObjectId } // OR logic by default
*/
const RuleSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
  type: { type: String, enum: ['percentage', 'specific', 'hybrid'], required: true },
  settings: { type: Object } // store threshold and approverId etc.
}, { timestamps: true });

module.exports = mongoose.model('Rule', RuleSchema);
