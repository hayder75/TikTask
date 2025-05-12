const mongoose = require('mongoose');

const campaignApplicationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submission: {
    tiktokVideoLink: { type: String },
    statsSnapshot: {
      likes: { type: Number },
      views: { type: Number },
      lastUpdated: { type: Date },
    },
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CampaignApplication', campaignApplicationSchema);