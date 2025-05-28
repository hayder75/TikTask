const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  videoLink: { type: String, required: true },
  minFollowerCount: { type: Number, required: true },
  allowedMarketers: { type: Number, required: true },
  baseBid: {
    proposedLikes: { type: Number, required: true },
    proposedViews: { type: Number, required: true },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'completed', 'hidden'], default: 'active' },
  expiresAt: { type: Date, required: true },
  budget: { type: Number, required: true },
  remainingBudget: {
    type: Number,
    required: true,
    default: function () {
      return this.budget;
    },
  },
  totalPayout: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Campaign', campaignSchema);