const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../utils/chapa');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// Initiate payment route
router.post('/initiate', async (req, res) => {
  const { campaignId, amount } = req.body;
  const user = req.user; // Assuming authentication middleware sets req.user

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const tx_ref = `campaign-${campaignId}-${Date.now()}`;
    const return_url = `https://yourdomain.com/payment-success?tx_ref=${tx_ref}`;
    const callback_url = `https://yourapi.com/api/payments/verify/${tx_ref}`;

    const paymentResponse = await initiatePayment({
      amount,
      tx_ref,
      email: user.email,
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ')[1] || '',
      return_url,
      callback_url,
    });

    if (paymentResponse.status === 'success') {
      // Optionally, save tx_ref and related info to your database for tracking
      res.json({ checkout_url: paymentResponse.data.checkout_url });
    } else {
      res.status(400).json({ message: 'Failed to initiate payment' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify payment route
router.get('/verify/:tx_ref', async (req, res) => {
  const { tx_ref } = req.params;

  try {
    const verificationResponse = await verifyPayment(tx_ref);

    if (verificationResponse.status === 'success' && verificationResponse.data.status === 'success') {
      // Update campaign or user balance as needed
      // For example:
      // await Campaign.findByIdAndUpdate(campaignId, { $inc: { balance: amount } });

      res.json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
