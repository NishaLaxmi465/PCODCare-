const express = require('express');
const requireAuth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { uploadReport } = require('../middleware/upload');
const {
  listReports,
  uploadReport: createReport,
  getReport,
  downloadReport,
  updateReport,
  deleteReport,
  exportHealthPdf,
} = require('../controllers/reportController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listReports);
router.post('/', uploadReport.single('report'), createReport);
router.get('/health/export', exportHealthPdf);
router.get('/:id', validateObjectId(), getReport);
router.patch('/:id', validateObjectId(), updateReport);
router.get('/:id/download', validateObjectId(), downloadReport);
router.delete('/:id', validateObjectId(), deleteReport);

module.exports = router;
