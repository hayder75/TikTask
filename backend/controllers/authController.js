const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    if (role === 'marketer') {
      user.tiktokUsername = null; // Will be updated post-auth
      user.followerCount = 0;    // Will be updated post-auth
    }

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
        followerCount: user.followerCount,
        connectionCoins: user.connectionCoins,
        verified: user.verified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// TikTok auth route
const tiktokAuth = (req, res) => {
  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const REDIRECT_URI = process.env.REDIRECT_URI || 'https://38c2-102-213-69-75.ngrok-free.app/auth/callback';
  const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_KEY}&scope=user.info.profile,user.info.stats&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
};

// TikTok callback route
const tiktokCallback = async (req, res) => {
  const { code } = req.query;
  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI || 'https://38c2-102-213-69-75.ngrok-free.app/auth/callback';

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token } = tokenResponse.data;

    // Fetch user data with required fields
    const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: {
        fields: 'display_name,stats.follower_count' // Specify required fields
      }
    });
    const { data: { user } } = userResponse.data;
    const username = user.display_name || user.open_id; // Fallback to open_id if display_name is unavailable
    const followerCount = user.stats?.follower_count || 0; // Safely access follower_count

    // Find or create user
    let userDoc = await User.findOne({ tiktokUsername: username });
    if (!userDoc) {
      userDoc = new User({
        name: username,
        role: 'marketer',
        tiktokUsername: username,
        followerCount,
        verified: true, // Assume verified via TikTok auth
      });
      await userDoc.save();
      console.log('New user saved:', { username, followerCount, _id: userDoc._id });
    } else {
      userDoc.followerCount = followerCount; // Update follower count
      await userDoc.save();
      console.log('User updated:', { username, followerCount, _id: userDoc._id });
    }

    // Generate JWT token
    const token = jwt.sign({ id: userDoc._id, role: userDoc.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // Redirect to dashboard with query params
    res.redirect(`${REDIRECT_URI.split('/auth')[0]}/dashboard?token=${token}&username=${encodeURIComponent(username)}&followers=${followerCount}`);
  } catch (error) {
    console.error('TikTok auth error:', error.response ? error.response.data : error.message);
    res.status(500).send('TikTok authentication failed: ' + error.message);
  }
};

module.exports = { register, login, tiktokAuth, tiktokCallback };