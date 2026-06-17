const express = require('express');
const requireAuth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listNotifications);
router.post('/', createNotification);
router.patch('/:id', validateObjectId(), updateNotification);
router.delete('/:id', validateObjectId(), deleteNotification);

module.exports = router;
