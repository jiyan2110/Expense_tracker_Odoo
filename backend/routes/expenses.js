const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const expenseController = require('../controllers/expenseController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// create expense
router.post('/', auth.requireAuth, upload.array('receipts', 3), expenseController.createExpense);

// OCR endpoint for receipt parsing
router.post('/ocr', auth.requireAuth, upload.single('receipt'), expenseController.ocrReceipt);

// get all expenses (optionally pending for me)
router.get('/', auth.requireAuth, expenseController.listExpenses);

// approve/reject endpoints
router.post('/:id/approve', auth.requireAuth, expenseController.approveExpense);
router.post('/:id/reject', auth.requireAuth, expenseController.rejectExpense);

module.exports = router;
