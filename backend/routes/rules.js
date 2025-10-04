const express = require('express');
const router = express.Router();
const { authMiddleware, requireRoles } = require('../utils/authMiddleware');
const Rule = require('../models/Rule');

// Create or update rule (admin only)
router.post('/', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const { type, settings } = req.body;
    let rule = await Rule.findOne({ companyId: req.user.companyId });
    if (!rule) {
      rule = new Rule({ companyId: req.user.companyId, type, settings });
    } else {
      rule.type = type;
      rule.settings = settings;
    }
    await rule.save();
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const rule = await Rule.findOne({ companyId: req.user.companyId });
  res.json(rule || {});
});

module.exports = router;
