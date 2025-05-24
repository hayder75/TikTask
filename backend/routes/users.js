const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { deposit, withdraw, setBalance } = require('../controllers/chapa-mock/userController');

const router = express.Router();

router.post('/:userId/deposit', protect, deposit);
router.post('/:userId/withdraw', protect, withdraw);
router.post('/:userId/set-balance', protect, setBalance);

module.exports = router;