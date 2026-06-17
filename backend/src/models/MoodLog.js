const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'low', 'anxious', 'irritable'],
      required: true,
    },
    stressLevel: { type: Number, min: 0, max: 10, default: 0 },
    sleepHours: { type: Number, min: 0, max: 24 },
    notes: { type: String, trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

moodLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('MoodLog', moodLogSchema);
