const mongoose = require('mongoose');

const SignalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  rsi: { type: Number, required: true },
  signal: { type: String, enum: ['BUY', 'SELL', 'HOLD'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Signal', SignalSchema);