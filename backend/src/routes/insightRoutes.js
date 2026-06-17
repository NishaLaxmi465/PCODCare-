const express = require('express');
const requireAuth = require('../middleware/auth');
const { getInsights, getAnalytics, getDashboard } = require('../controllers/insightController');

const router = express.Router();

router.use(requireAuth);
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/', getInsights);

module.exports = router;
