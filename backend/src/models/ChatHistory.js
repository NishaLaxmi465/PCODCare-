const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true, maxlength: 8000 },
  },
  { _id: false, timestamps: true },
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, trim: true, maxlength: 120, default: 'PCOS support' },
    messages: [messageSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
