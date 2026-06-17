const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    weightKg: { type: Number, required: true, min: 20, max: 300 },
    waistCm: { type: Number, min: 30, max: 250 },
    notes: { type: String, trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

weightLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('WeightLog', weightLogSchema);
