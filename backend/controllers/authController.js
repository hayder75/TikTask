const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { assignMockTikTokData } = require('../utils/mockTikTokData');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let tikTokData = null;
    if (role === 'marketer') {
      tikTokData = assignMockTikTokData(name);
      if (!tikTokData) {
        return res.status(400).json({ message: 'Invalid TikTok username for mock data' });
      }
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      ...tikTokData,
    });

    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tiktokUsername: user.tiktokUsername,
        tiktokProfile: user.tiktokProfile,
        followerCount: user.followerCount,
        connectionCoins: user.connectionCoins,
        verified: user.verified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tiktokUsername: user.tiktokUsername,
        tiktokProfile: user.tiktokProfile,
        followerCount: user.followerCount,
        connectionCoins: user.connectionCoins,
        verified: user.verified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };