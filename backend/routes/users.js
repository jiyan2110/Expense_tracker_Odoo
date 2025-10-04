const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');

// create user - admin only
router.post('/', auth.requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only admin' });
    const { name, email, password, role, managerId } = req.body;
    // delegate to auth controller style logic to hash
    const authController = require('../controllers/authController');
    const newUser = await authController.createUserForCompany({ name, email, password, role, managerId, companyId: req.user.companyId });
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// list company users
router.get('/', auth.requireAuth, async (req, res) => {
  try {
    const users = await User.find({ companyId: req.user.companyId }).select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
