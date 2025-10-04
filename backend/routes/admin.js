const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRoles } = require('../utils/authMiddleware');

router.use(authMiddleware);
router.use(requireRoles('Admin'));

// User management
router.post('/users', adminController.createUser);
router.get('/users/:companyId', adminController.listUsers);
router.put('/users/:id', adminController.updateUser);

// Rule management
router.post('/rules', adminController.createRule);
router.get('/rules/:companyId', adminController.getRules);
router.put('/rules/:id', adminController.updateRule);
router.delete('/rules/:id', adminController.deleteRule);

module.exports = router;
