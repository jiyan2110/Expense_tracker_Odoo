const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Employee'], default: 'Employee' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  isManagerApprover: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
