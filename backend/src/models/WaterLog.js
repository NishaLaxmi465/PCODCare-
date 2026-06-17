const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    volumeMl: { type: Number, required: true, min: 50, max: 10000 },
    targetMl: { type: Number, min: 500, max: 8000, default: 2500 },
    notes: { type: String, trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

waterLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('WaterLog', waterLogSchema);
