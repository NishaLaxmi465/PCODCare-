const mongoose = require('mongoose');

const stepLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    steps: { type: Number, required: true, min: 0, max: 100000 },
    caloriesBurned: { type: Number, min: 0, max: 5000, default: 0 },
    source: { type: String, trim: true, default: 'manual' },
  },
  { timestamps: true },
);

stepLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('StepLog', stepLogSchema);
