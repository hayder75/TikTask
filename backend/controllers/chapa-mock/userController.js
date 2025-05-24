const User = require('../../models/User');

const deposit = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    console.log(`Simulating deposit of ${amount} Birr for user ${user.email} via Chapa...`);
    user.balance += amount;
    await user.save();

    res.json({ message: `Deposited ${amount} Birr`, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const withdraw = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (user._id.toString() !== req.user._id.toString()) {
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
    if (user._id.toString() !== req.user._id.toString()) {
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

module.exports = { deposit, withdraw, setBalance };