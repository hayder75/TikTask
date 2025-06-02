const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { getBalance, deposit, withdraw, chapaCallback,getTransactionStatus, applyPayouts , linkTelegram} = require('../controllers/chapa-mock/userController');
const { triggerProcessDailyPayouts } = require('../controllers/paymentController');
const router = express.Router();

router.get('/:userId/balance', protect, getBalance);
router.post('/:userId/deposit', protect, deposit);
router.post('/:userId/withdraw', protect, withdraw);
router.post('/chapa-callback',chapaCallback);
router.get('/transaction/:tx_ref/status', protect, getTransactionStatus);
// New endpoint for applying payouts (admin-only or secure access)
router.post('/apply-payouts', applyPayouts);
// New endpoint to trigger daily payouts
router.post('/process-daily-payouts', triggerProcessDailyPayouts);
router.get('/:userId/link-telegram', protect, linkTelegram);
module.exports = router;