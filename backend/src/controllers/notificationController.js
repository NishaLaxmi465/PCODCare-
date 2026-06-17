const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const listNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.read !== undefined) filter.read = req.query.read === 'true';

  const notifications = await Notification.find(filter).sort({ read: 1, reminderAt: 1, createdAt: -1 });
  res.json(notifications);
});

const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({ ...req.body, user: req.user._id });
  res.status(201).json(notification);
});

const updateNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json(notification);
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.status(204).send();
});

module.exports = { listNotifications, createNotification, updateNotification, deleteNotification };
