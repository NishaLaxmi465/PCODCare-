const express = require('express');
const requireAuth = require('../middleware/auth');
const { getSuggestions, generateDietPlan, chat, listChats } = require('../controllers/aiController');

const router = express.Router();

router.use(requireAuth);
router.get('/suggestions', getSuggestions);
router.get('/chats', listChats);
router.post('/diet-plan', generateDietPlan);
router.post('/chat', chat);

module.exports = router;
