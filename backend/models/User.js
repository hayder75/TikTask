const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['seller', 'marketer', 'admin'], default: 'marketer' },
  tiktokUsername: { type: String },
  tiktokProfile: { type: String },
  followerCount: { type: Number, default: 0 },
  connectionCoins: { type: Number, default: 10 },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);