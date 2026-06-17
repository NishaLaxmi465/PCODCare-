const mongoose = require('mongoose');

const exerciseLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    activity: { type: String, required: true, trim: true, maxlength: 80 },
    minutes: { type: Number, required: true, min: 1, max: 600 },
    caloriesBurned: { type: Number, min: 0, max: 5000, default: 0 },
    intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    notes: { type: String, trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

exerciseLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('ExerciseLog', exerciseLogSchema);
