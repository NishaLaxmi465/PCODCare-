const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    dosage: { type: String, required: true, trim: true, maxlength: 80 },
    frequency: { type: String, required: true, trim: true, maxlength: 80 },
    reminderTime: { type: String, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm reminder time'] },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: Date,
    takenDates: [{ type: Date }],
    notes: { type: String, trim: true, maxlength: 600 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medicationLogSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('MedicationLog', medicationLogSchema);
