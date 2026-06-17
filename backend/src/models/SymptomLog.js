const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    cycleDay: { type: Number, min: 1, max: 120 },
    cycleLengthDays: { type: Number, min: 10, max: 120 },
    periodStartDate: Date,
    periodFlow: { type: String, enum: ['none', 'spotting', 'light', 'medium', 'heavy'], default: 'none' },
    cramps: { type: Number, min: 0, max: 10, default: 0 },
    acne: { type: Number, min: 0, max: 10, default: 0 },
    hairFall: { type: Number, min: 0, max: 10, default: 0 },
    moodSwings: { type: Number, min: 0, max: 10, default: 0 },
    bloating: { type: Number, min: 0, max: 10, default: 0 },
    fatigue: { type: Number, min: 0, max: 10, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

symptomLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
