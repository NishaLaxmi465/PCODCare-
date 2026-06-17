const express = require('express');
const requireAuth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listAppointments);
router.post('/', createAppointment);
router.patch('/:id', validateObjectId(), updateAppointment);
router.delete('/:id', validateObjectId(), deleteAppointment);

module.exports = router;
