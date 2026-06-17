const express = require('express');
const requireAuth = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);
router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.patch('/me/password', changePassword);

module.exports = router;
