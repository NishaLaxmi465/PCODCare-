const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: ['lab', 'ultrasound', 'prescription', 'consultation', 'other'],
      default: 'other',
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, max: 10 * 1024 * 1024 },
    path: { type: String, required: true },
  },
  { timestamps: true },
);

medicalReportSchema.index({ user: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
