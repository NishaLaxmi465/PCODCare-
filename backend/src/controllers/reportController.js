const fs = require('fs/promises');
const path = require('path');
const PDFDocument = require('pdfkit');
const MedicalReport = require('../models/MedicalReport');
const SymptomLog = require('../models/SymptomLog');
const WeightLog = require('../models/WeightLog');
const WaterLog = require('../models/WaterLog');
const ExerciseLog = require('../models/ExerciseLog');
const StepLog = require('../models/StepLog');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { computeHealthInsights } = require('../services/healthInsights');
const { uploadDir } = require('../middleware/upload');

function safeReportPath(filePath) {
  const resolvedUploadDir = path.resolve(uploadDir);
  const resolvedPath = path.resolve(filePath);
  const normalizedUploadDir = resolvedUploadDir.toLowerCase();
  const normalizedPath = resolvedPath.toLowerCase();

  if (normalizedPath !== normalizedUploadDir && !normalizedPath.startsWith(`${normalizedUploadDir}${path.sep}`)) {
    throw new ApiError(403, 'Report path is invalid');
  }

  return resolvedPath;
}

const listReports = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const reports = await MedicalReport.find(filter).sort({ createdAt: -1 });
  res.json(reports);
});

const uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Report file is required');
  }

  let report;
  try {
    report = await MedicalReport.create({
      user: req.user._id,
      title: req.body.title || req.file.originalname,
      category: req.body.category || 'other',
      notes: req.body.notes,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: safeReportPath(req.file.path),
    });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw error;
  }

  res.status(201).json(report);
});

const getReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.json(report);
});

const downloadReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.download(safeReportPath(report.path), report.originalName);
});

const updateReport = asyncHandler(async (req, res) => {
  const updates = {};
  ['title', 'category', 'notes'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const report = await MedicalReport.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true },
  );

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.json(report);
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const reportPath = safeReportPath(report.path);
  await MedicalReport.deleteOne({ _id: report._id, user: req.user._id });
  await fs.unlink(reportPath).catch(() => undefined);
  res.status(204).send();
});

function addMetric(doc, label, value) {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value ?? 'Not available');
}

const exportHealthPdf = asyncHandler(async (req, res) => {
  const [insights, symptoms, weights, waters, exercises, steps] = await Promise.all([
    computeHealthInsights(req.user),
    SymptomLog.find({ user: req.user._id }).sort({ date: -1 }).limit(10),
    WeightLog.find({ user: req.user._id }).sort({ date: -1 }).limit(10),
    WaterLog.find({ user: req.user._id }).sort({ date: -1 }).limit(10),
    ExerciseLog.find({ user: req.user._id }).sort({ date: -1 }).limit(10),
    StepLog.find({ user: req.user._id }).sort({ date: -1 }).limit(10),
  ]);

  const doc = new PDFDocument({ margin: 48 });
  const filename = `pcodcare-health-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(22).font('Helvetica-Bold').text('PCODCare Health Report');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`);
  doc.text(`Name: ${req.user.name}`);
  doc.text(`Email: ${req.user.email}`);
  doc.moveDown();

  doc.fontSize(16).font('Helvetica-Bold').text('Health Insights');
  doc.moveDown(0.5);
  doc.fontSize(11);
  addMetric(doc, 'Risk score', `${insights.score}/100 (${insights.category})`);
  addMetric(doc, 'BMI', insights.bmi);
  addMetric(doc, 'Latest weight', insights.latestWeightKg ? `${insights.latestWeightKg} kg` : null);
  addMetric(doc, 'Cycle status', `${insights.cycleAnalysis.status} (mean ${insights.cycleAnalysis.mean || 'n/a'}, std-dev ${insights.cycleAnalysis.stdDev || 'n/a'})`);
  addMetric(doc, 'Average steps', insights.averages.steps);

  doc.moveDown();
  doc.font('Helvetica-Bold').text('Key Contributors');
  insights.contributors.forEach((item) => {
    doc.font('Helvetica').text(`- ${item.label}: ${item.points} points. ${item.detail}`);
  });

  doc.moveDown();
  doc.font('Helvetica-Bold').text('Recommendations');
  insights.recommendations.forEach((item) => doc.font('Helvetica').text(`- ${item}`));

  const sections = [
    ['Recent Symptoms', symptoms, (item) => `${item.date.toISOString().slice(0, 10)}: cramps ${item.cramps}/10, acne ${item.acne}/10, hair fall ${item.hairFall}/10`],
    ['Recent Weight', weights, (item) => `${item.date.toISOString().slice(0, 10)}: ${item.weightKg} kg`],
    ['Recent Water', waters, (item) => `${item.date.toISOString().slice(0, 10)}: ${item.volumeMl} ml`],
    ['Recent Exercise', exercises, (item) => `${item.date.toISOString().slice(0, 10)}: ${item.activity}, ${item.minutes} min, ${item.caloriesBurned || 0} kcal`],
    ['Recent Steps', steps, (item) => `${item.date.toISOString().slice(0, 10)}: ${item.steps} steps`],
  ];

  sections.forEach(([title, rows, format]) => {
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text(title);
    doc.fontSize(10).font('Helvetica');
    if (!rows.length) {
      doc.text('No records yet.');
      return;
    }
    rows.forEach((item) => doc.text(`- ${format(item)}`));
  });

  doc.moveDown();
  doc.fontSize(9).font('Helvetica-Oblique').text(
    'This report summarizes user-entered tracking data and is not a medical diagnosis. Please consult a qualified clinician for medical decisions.',
  );
  doc.end();
});

module.exports = {
  listReports,
  uploadReport,
  getReport,
  downloadReport,
  updateReport,
  deleteReport,
  exportHealthPdf,
};
