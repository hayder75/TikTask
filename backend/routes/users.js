const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { getBalance, deposit, withdraw, chapaCallback } = require('../controllers/chapa-mock/userController');

const router = express.Router();

router.get('/:userId/balance', protect, getBalance);
router.post('/:userId/deposit', protect, deposit);
router.post('/:userId/withdraw', protect, withdraw);
router.post('/:userId/chapa-callback', protect, chapaCallback);

module.exports = router;