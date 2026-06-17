const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorName: { type: String, required: true, trim: true, maxlength: 120 },
    specialty: { type: String, trim: true, maxlength: 120, default: 'Gynecologist' },
    dateTime: { type: Date, required: true, index: true },
    location: { type: String, trim: true, maxlength: 200 },
    reason: { type: String, trim: true, maxlength: 600 },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

appointmentSchema.index({ user: 1, dateTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
