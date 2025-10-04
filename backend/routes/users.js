const express = require('express');
const router = express.Router();
const { authMiddleware, requireRoles } = require('../utils/authMiddleware');
const User = require('../models/User');

// create user - admin only
router.post('/', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
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
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ companyId: req.user.companyId }).select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
