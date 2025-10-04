const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authMiddleware } = require('../utils/authMiddleware');
const upload = require('../config/multer');

router.use(authMiddleware);

router.post('/', expenseController.createExpense);
router.post('/:id/submit', expenseController.submitExpense);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/:id/approve', expenseController.approveExpense);
router.post('/:id/reject', expenseController.rejectExpense);
router.post('/:id/upload-receipt', upload.single('receipt'), expenseController.uploadReceipt);

module.exports = router;
