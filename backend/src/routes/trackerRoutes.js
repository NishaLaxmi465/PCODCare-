const express = require('express');
const requireAuth = require('../middleware/auth');
const { listLogs, createLog, updateLog, deleteLog } = require('../controllers/trackerController');

const router = express.Router();

router.use(requireAuth);
router.get('/:type', listLogs);
router.post('/:type', createLog);
router.patch('/:type/:id', updateLog);
router.delete('/:type/:id', deleteLog);

module.exports = router;
