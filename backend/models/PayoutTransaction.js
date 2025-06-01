const mongoose = require('mongoose');

const payoutTransactionSchema = new mongoose.Schema({
  marketerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampaignApplication',
    required: true,
  },
  campaignBudget: {
    type: Number,
    required: true,
  },
  performanceFactor: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PayoutTransaction', payoutTransactionSchema);

// const mongoose = require('mongoose');

// const payoutTransactionSchema = new mongoose.Schema({
//   marketerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'completed', 'failed'],
//     default: 'completed',
//   },
//   campaignBudget: {
//     type: Number,
//     required: true,
//   },
//   performanceFactor: {
//     type: Number,
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model('PayoutTransaction', payoutTransactionSchema);