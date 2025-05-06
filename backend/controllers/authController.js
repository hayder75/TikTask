const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { getMockUserInfo } = require('../utils/mockTikTokData');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, email, password, role });
    await user.save();

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ token, user: { id: user._id, name, email, role } });
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
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email,
        role: user.role,
        followerCount: user.followerCount,
        tiktokProfile: user.tiktokProfile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const mockTikTokSignup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Simulate TikTok OAuth signup
    const userInfo = getMockUserInfo(email);

    user = new User({
      name: userInfo.username,
      email,
      password: 'mock_tiktok_' + Math.random().toString(36).slice(2),
      role: 'marketer',
      tiktokUsername: userInfo.username,
      tiktokUserId: userInfo.open_id,
      followerCount: userInfo.follower_count,
      tiktokProfile: userInfo.profile_deep_link,
    });
    await user.save();

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email,
        role: user.role,
        followerCount: user.followerCount,
        tiktokProfile: user.tiktokProfile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Mock TikTok signup failed: ' + error.message });
  }
};

module.exports = { register, login, mockTikTokSignup };