const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["seller", "marketer", "admin"],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  tiktokUsername: {
    type: String,
    required: function () {
      return this.role === "marketer";
    },
  },
  followerCount: {
    type: Number,
    required: function () {
      return this.role === "marketer";
    },
  },
  telegramChatId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  tiktokProfile: { type: String },
  connectionCoins: { type: Number, default: 10 },
  verified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
