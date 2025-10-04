const User = require('../models/User');
const Rule = require('../models/Rule');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, managerId, companyId, password } = req.body;
    
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password || 'TempPass123', 10);
    const user = new User({ 
      name, 
      email, 
      password: hashed,
      role, 
      managerId: managerId || null, 
      companyId 
    });
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('Fetching users for company:', companyId);
    const users = await User.find({ companyId })
      .select('-password')
      .populate('managerId', 'name email')
      .populate('companyId', 'name defaultCurrency');
    console.log('Found users:', users.length);
    console.log('Users:', users.map(u => ({ name: u.name, role: u.role, email: u.email })));
    res.json(users);
  } catch (err) { 
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message }); 
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, managerId, isActive } = req.body;
    
    const user = await User.findById(id);
    if(!user) return res.status(404).json({ error: 'User not found' });
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (managerId !== undefined) user.managerId = managerId;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

exports.createRule = async (req, res) => {
  try {
    const { 
      companyId, 
      userId, 
      name, 
      description, 
      category, 
      isManagerApprover, 
      approvers, 
      approvalSequence, 
      minApprovalPercentage, 
      amountThreshold 
    } = req.body;
    
    const rule = new Rule({ 
      companyId, 
      userId,
      name, 
      description,
      category, 
      isManagerApprover: isManagerApprover !== undefined ? isManagerApprover : true,
      approvers: approvers || [], 
      approvalSequence: approvalSequence !== undefined ? approvalSequence : true,
      minApprovalPercentage: minApprovalPercentage || 100,
      amountThreshold: amountThreshold || 0
    });
    await rule.save();
    
    const populatedRule = await Rule.findById(rule._id)
      .populate('userId', 'name email role')
      .populate('approvers', 'name email role');
    
    res.json(populatedRule);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

exports.getRules = async (req, res) => {
  try {
    const { companyId } = req.params;
    const rules = await Rule.find({ companyId, isActive: true })
      .populate('userId', 'name email role')
      .populate('approvers', 'name email role')
      .sort({ createdAt: -1 });
    res.json(rules);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const rule = await Rule.findById(id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        rule[key] = updateData[key];
      }
    });
    
    await rule.save();
    
    const populatedRule = await Rule.findById(rule._id)
      .populate('userId', 'name email role')
      .populate('approvers', 'name email role');
    
    res.json(populatedRule);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await Rule.findById(id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    
    rule.isActive = false;
    await rule.save();
    
    res.json({ message: 'Rule deactivated successfully' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};
