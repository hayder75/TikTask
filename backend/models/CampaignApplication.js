const mongoose = require('mongoose');

const campaignApplicationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'aborted'],
    default: 'pending',
  },
  submission: {
    tiktokVideoLink: { type: String },
    statsSnapshot: {
      likes: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CampaignApplication', campaignApplicationSchema);