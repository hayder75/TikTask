const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tx_ref: { type: String, required: true, unique: true }, // Chapa transaction reference
  amount: { type: Number, required: true }, // Amount deposited
  currency: { type: String, default: 'ETB' }, // Currency (Ethiopian Birr)
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' }, // Transaction status
  createdAt: { type: Date, default: Date.now }, // Date of transaction
  updatedAt: { type: Date, default: Date.now }, // Last update date
});

module.exports = mongoose.model('Transaction', transactionSchema);