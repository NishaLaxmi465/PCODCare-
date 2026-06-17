const mongoose = require('mongoose');
const SymptomLog = require('../models/SymptomLog');
const WeightLog = require('../models/WeightLog');
const WaterLog = require('../models/WaterLog');
const ExerciseLog = require('../models/ExerciseLog');
const StepLog = require('../models/StepLog');
const MoodLog = require('../models/MoodLog');
const MedicationLog = require('../models/MedicationLog');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const getDateRange = require('../utils/dateRange');

const trackerModels = {
  symptoms: SymptomLog,
  weight: WeightLog,
  water: WaterLog,
  exercise: ExerciseLog,
  steps: StepLog,
  mood: MoodLog,
  medications: MedicationLog,
};

function modelFor(type) {
  const Model = trackerModels[type];
  if (!Model) {
    throw new ApiError(404, `Unknown tracker type: ${type}`);
  }
  return Model;
}

function filterFor(type, req) {
  const filter = { user: req.user._id };
  if (type !== 'medications') {
    const { from, to } = getDateRange(req.query);
    filter.date = { $gte: from, $lte: to };
  }

  if (req.query.active !== undefined && type === 'medications') {
    filter.active = req.query.active === 'true';
  }

  return filter;
}

const listLogs = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const Model = modelFor(type);
  const logs = await Model.find(filterFor(type, req)).sort(type === 'medications' ? { createdAt: -1 } : { date: -1 });
  res.json(logs);
});

const createLog = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const Model = modelFor(type);
  const log = await Model.create({ ...req.body, user: req.user._id });
  res.status(201).json(log);
});

const updateLog = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid log id');
  }

  const Model = modelFor(type);
  const log = await Model.findOneAndUpdate({ _id: id, user: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!log) {
    throw new ApiError(404, 'Log not found');
  }

  res.json(log);
});

const deleteLog = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid log id');
  }

  const Model = modelFor(type);
  const log = await Model.findOneAndDelete({ _id: id, user: req.user._id });

  if (!log) {
    throw new ApiError(404, 'Log not found');
  }

  res.status(204).send();
});

module.exports = { listLogs, createLog, updateLog, deleteLog, trackerModels };
