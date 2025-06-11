const mongoose = require('mongoose');

const tiktokVideoStatsSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  username: { type: String, default: 'Unknown' },
  stats: [
    {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('TiktokVideoStats', tiktokVideoStatsSchema);