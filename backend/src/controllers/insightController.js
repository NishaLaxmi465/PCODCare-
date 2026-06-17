const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { trackerModels } = require('./trackerController');
const asyncHandler = require('../utils/asyncHandler');
const getDateRange = require('../utils/dateRange');
const { computeHealthInsights, buildAnalytics } = require('../services/healthInsights');

const getInsights = asyncHandler(async (req, res) => {
  const insights = await computeHealthInsights(req.user);
  res.json(insights);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const { from, to } = getDateRange(req.query);
  const analytics = await buildAnalytics(req.user, from, to);
  res.json(analytics);
});

const getDashboard = asyncHandler(async (req, res) => {
  const [insights, notifications, appointments, latest] = await Promise.all([
    computeHealthInsights(req.user),
    Notification.find({ user: req.user._id }).sort({ read: 1, reminderAt: 1, createdAt: -1 }).limit(8),
    Appointment.find({ user: req.user._id, dateTime: { $gte: new Date() } }).sort({ dateTime: 1 }).limit(5),
    Promise.all(
      Object.entries(trackerModels).map(async ([type, Model]) => [
        type,
        await Model.findOne({ user: req.user._id }).sort(type === 'medications' ? { createdAt: -1 } : { date: -1 }),
      ]),
    ),
  ]);

  res.json({
    user: req.user,
    insights,
    notifications,
    appointments,
    latest: Object.fromEntries(latest),
  });
});

module.exports = { getInsights, getAnalytics, getDashboard };
