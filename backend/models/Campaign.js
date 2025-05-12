const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  minFollowerCount: { type: Number, required: true },
  allowedMarketers: { type: Number, required: true, default: 4 },
  baseBid: {
    proposedLikes: { type: Number, required: true },
    proposedViews: { type: Number, required: true },
    proposedPrice: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ["active", "hidden", "completed"],
    default: "active",
  },
  expiresAt: { type: Date, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Campaign", campaignSchema);
