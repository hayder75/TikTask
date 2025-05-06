const mongoose = require('mongoose');

const campaignApplicationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bid: {
    proposedLikes: { type: Number, required: true },
    proposedViews: { type: Number, required: true },
    proposedPrice: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'withdrawn'],
    default: 'pending',
  },
  tiktokVideoLink: { type: String },
  statsSnapshot: {
    likes: { type: Number },
    views: { type: Number },
    lastUpdated: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CampaignApplication', campaignApplicationSchema);