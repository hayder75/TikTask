const express = require('express');
const router = express.Router();
const { initiatePayment, verifyTransaction } = require('../utils/chapa');
const User = require('../models/User');
const { protect, restrictTo } = require('../utils/authMiddleware');// your JWT auth middleware

// Initiate deposit
router.post('/deposit', protect, restrictTo('seller'), async (req, res) => {
  const { amount } = req.body;
  const user = req.user;
  const fullName = user.name || '';
  const [firstName, lastName = ''] = fullName.split(' ');
  if (user.role !== 'seller') {
    return res.status(403).json({ message: 'Only sellers can deposit money' });
  }

  const tx_ref = `deposit-${user._id}-${Date.now()}`;
  const return_url = `${process.env.FRONTEND_URL}/payment-success?tx_ref=${tx_ref}`;
  const callback_url = `http://localhost:3000/api/payments/verify/${tx_ref}`;

  try {
    const paymentResponse = await initiatePayment({
      amount,
      tx_ref,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      return_url,
      callback_url,
    });

    if (paymentResponse.status === 'success') {
      res.json({ checkout_url: paymentResponse.data.checkout_url });
    } else {
      res.status(400).json({ message: 'Failed to initiate payment' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify deposit
router.get('/verify/:tx_ref', async (req, res) => {
  const { tx_ref } = req.params;

  try {
    const result = await verifyTransaction(tx_ref);

    if (result.status === 'success' && result.data.status === 'success') {
      const userId = tx_ref.split('-')[1];
      const amount = parseFloat(result.data.amount);

      const user = await User.findById(userId);
      if (user) {
        user.balance += amount;
        await user.save();
        return res.json({ message: 'Deposit successful and balance updated', balance: user.balance });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      return res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying transaction', error: error.message });
  }
});

module.exports = router;
