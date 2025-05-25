const User = require('../../models/User');
const axios = require('axios');

const deposit = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const email = user.email && user.email.includes('@') ? user.email : 'test@example.com';
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Invalid or missing user email' });
    }
    console.log(`Using email for Chapa request: ${email}`); // Debug log

    const chapaData = {
      amount: parseFloat(amount),
      currency: 'ETB',
      email: email,
      first_name: user.name.split(' ')[0] || 'Seller',
      last_name: user.name.split(' ')[1] || '',
      tx_ref: `DEP-${userId}-${Date.now()}`,
      callback_url: `${appUrl}/api/users/${userId}/chapa-callback`,
      return_url: `${appUrl}/dashboard`,
      customization: { title: 'Deposit' },
    };

    const response = await axios.post(
      `${process.env.CHAPA_BASE_URL}/transaction/initialize`,
      chapaData,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'success') {
      return res.json({ message: 'Redirecting to Chapa payment', checkout_url: response.data.data.checkout_url });
    }
    return res.status(400).json({ message: 'Chapa payment initiation failed', details: response.data.message });
  } catch (error) {
    console.error('Chapa deposit error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error', error: error.response?.data?.message || error.message });
  }
};

const chapaCallback = async (req, res) => {
  const { userId } = req.params;
  const { tx_ref, status } = req.body;

  try {
    if (status !== 'success') {
      return res.status(400).json({ message: 'Payment failed or pending' });
    }

    const response = await axios.get(
      `${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    if (response.data.data.status === 'success') {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.balance += parseFloat(response.data.data.amount);
      await user.save();

      return res.json({ message: 'Deposit successful', balance: user.balance });
    }
    return res.status(400).json({ message: 'Payment verification failed' });
  } catch (error) {
    console.error('Chapa callback error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const withdraw = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    console.log(`Simulating withdrawal of ${amount} Birr for user ${user.email} via Chapa...`);
    user.balance -= amount;
    await user.save();

    res.json({ message: `Withdrawn ${amount} Birr`, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const setBalance = async (req, res) => {
  const { userId } = req.params;
  const { balance } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (balance < 0) {
      return res.status(400).json({ message: 'Balance cannot be negative' });
    }

    user.balance = balance;
    await user.save();

    res.json({ message: `Balance set to ${balance} Birr`, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { deposit, chapaCallback, withdraw, setBalance };