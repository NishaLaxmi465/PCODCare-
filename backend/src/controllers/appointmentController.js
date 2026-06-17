const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const listAppointments = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const appointments = await Appointment.find(filter).sort({ dateTime: 1 });
  res.json(appointments);
});

const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create({ ...req.body, user: req.user._id });

  await Notification.create({
    user: req.user._id,
    title: `Appointment with ${appointment.doctorName}`,
    message: appointment.reason || 'Upcoming appointment reminder',
    type: 'appointment',
    reminderAt: appointment.dateTime,
    relatedModel: 'Appointment',
    relatedId: appointment._id,
  });

  res.status(201).json(appointment);
});

const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  res.json(appointment);
});

const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  await Notification.deleteMany({ user: req.user._id, relatedModel: 'Appointment', relatedId: appointment._id });
  res.status(204).send();
});

module.exports = { listAppointments, createAppointment, updateAppointment, deleteAppointment };
