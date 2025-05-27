const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const axios = require('axios');


const getBalance = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user || user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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
    console.log(`Initiating deposit for user ${userId} with email ${email}`);

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

    const transaction = new Transaction({
      userId: user._id,
      tx_ref: chapaData.tx_ref,
      amount: chapaData.amount,
      status: 'pending',
    });
    await transaction.save();
    console.log(`Created pending transaction: ${chapaData.tx_ref}`);

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
      console.log(`Chapa payment initiated successfully: ${response.data.data.checkout_url}`);
      return res.json({ message: 'Redirecting to Chapa payment', checkout_url: response.data.data.checkout_url });
    }
    await Transaction.findOneAndUpdate({ tx_ref: chapaData.tx_ref }, { status: 'failed', updatedAt: Date.now() });
    return res.status(400).json({ message: 'Chapa payment initiation failed', details: response.data.message });
  } catch (error) {
    console.error('Chapa deposit error:', error.response?.data || error.message);
    await Transaction.findOneAndUpdate({ tx_ref: `DEP-${userId}-${Date.now()}` }, { status: 'failed', updatedAt: Date.now() }, { upsert: false });
    res.status(500).json({ message: 'Server error', error: error.response?.data?.message || error.message });
  }
};

const chapaCallback = async (req, res) => {
  const { userId } = req.params;
  const { tx_ref, status } = req.body;

  console.log(`Chapa callback received for user ${userId} with tx_ref ${tx_ref} and status ${status}`);

  try {
    const transaction = await Transaction.findOne({ tx_ref });
    if (!transaction) {
      console.log(`Transaction not found for tx_ref ${tx_ref}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (status !== 'success') {
      console.log(`Payment status is not success: ${status || 'undefined'}`);
      await Transaction.findOneAndUpdate({ tx_ref }, { status: 'failed', updatedAt: Date.now() });
      return res.status(400).json({ message: 'Payment failed or pending' });
    }

    console.log(`Verifying transaction with Chapa for tx_ref ${tx_ref}`);
    const response = await axios.get(
      `${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    console.log(`Chapa verification response: ${JSON.stringify(response.data)}`);

    if (response.data.data && response.data.data.status === 'success') {
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User not found: ${userId}`);
        await Transaction.findOneAndUpdate({ tx_ref }, { status: 'failed', updatedAt: Date.now() });
        return res.status(404).json({ message: 'User not found' });
      }

      const amount = parseFloat(response.data.data.amount);
      user.balance = (user.balance || 0) + amount;
      console.log(`Updating user balance: ${user.balance - amount} + ${amount} = ${user.balance}`);
      await user.save();
      console.log(`Balance saved, new balance: ${user.balance}`);

      await Transaction.findOneAndUpdate(
        { tx_ref },
        { status: 'success', amount, updatedAt: Date.now() }
      );
      console.log(`Transaction updated to success for tx_ref ${tx_ref}`);

      return res.status(200).json({ message: 'Deposit successful', balance: user.balance });
    }

    console.log(`Payment verification failed: ${response.data.data ? response.data.data.status : 'No data'}`);
    await Transaction.findOneAndUpdate({ tx_ref }, { status: 'failed', updatedAt: Date.now() });
    return res.status(400).json({ message: 'Payment verification failed' });
  } catch (error) {
    console.error('Chapa callback error:', error.response?.data || error.message);
    if (tx_ref) {
      await Transaction.findOneAndUpdate({ tx_ref }, { status: 'failed', updatedAt: Date.now() }, { upsert: false });
    }
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

module.exports = { getBalance, deposit, chapaCallback, withdraw };