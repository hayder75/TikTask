const mongoose = require("mongoose");

const campaignApplicationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true,
  },
  marketerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "aborted"],
    default: "pending",
  },
  submission: {
    tiktokVideoLink: String,
    statsSnapshot: {
      likes: Number,
      views: Number,
      comments: Number,
      lastUpdated: Date,
      isActive: Boolean,
    },
  },
  lastProcessedStats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    lastProcessedAt: Date,
  },
  pendingPayout: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "CampaignApplication",
  campaignApplicationSchema
);