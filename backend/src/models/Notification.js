const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    type: {
      type: String,
      enum: ['medicine', 'water', 'exercise', 'appointment', 'system'],
      default: 'system',
    },
    reminderAt: Date,
    repeat: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    read: { type: Boolean, default: false },
    relatedModel: String,
    relatedId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, reminderAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
