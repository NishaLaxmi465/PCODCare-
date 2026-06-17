const ChatHistory = require('../models/ChatHistory');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  callLlm,
  fallbackDietPlan,
  fallbackChatAnswer,
  parseJsonOrWrap,
} = require('../services/llmService');
const { computeHealthInsights } = require('../services/healthInsights');

const quickQuestions = [
  'What PCOS symptoms should I track every week?',
  'How can I reduce insulin spikes in meals?',
  'What should I ask my doctor about irregular cycles?',
  'How much exercise is helpful for PCOS?',
  'Can you summarize my recent health trends?',
];

const getSuggestions = (_req, res) => {
  res.json(quickQuestions);
};

const generateDietPlan = asyncHandler(async (req, res) => {
  const insights = await computeHealthInsights(req.user);
  const prompt = JSON.stringify({
    instruction:
      'Create a PCOS-friendly diet plan. Return strict JSON with keys summary, eat, avoid, sampleDay, benefits, cautions. eat must include food, examples, benefits. avoid must include food and reason.',
    user: {
      name: req.user.name,
      profile: req.user.profile,
      insights,
    },
    preferences: req.body,
  });

  const text = await callLlm({
    system:
      'You are a careful PCOS nutrition assistant. Give general wellness support, not diagnosis. Mention clinician consultation for medical concerns. Return only JSON.',
    prompt,
  });

  const plan = parseJsonOrWrap(text, fallbackDietPlan(req.user, req.body));
  res.json(plan);
});

const chat = asyncHandler(async (req, res) => {
  const { message, historyId } = req.body;

  if (!message || message.trim().length < 2) {
    throw new ApiError(400, 'Message is required');
  }

  const insights = await computeHealthInsights(req.user);
  const chatHistory = historyId
    ? await ChatHistory.findOne({ _id: historyId, user: req.user._id })
    : await ChatHistory.create({ user: req.user._id, messages: [] });

  if (!chatHistory) {
    throw new ApiError(404, 'Chat history not found');
  }

  const recentMessages = chatHistory.messages.slice(-8).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const text = await callLlm({
    system:
      'You are PCODCare, a supportive PCOS health tracking assistant. You can explain trends, suggest questions for clinicians, and give general lifestyle information. Do not diagnose or prescribe.',
    prompt: JSON.stringify({
      message,
      recentMessages,
      userProfile: req.user.profile,
      insights,
      responseFormat: 'Return JSON with keys answer and followUps.',
    }),
  });

  const fallback = fallbackChatAnswer(message);
  const answer = parseJsonOrWrap(text, fallback);

  const assistantContent = answer.answer || answer.text || fallback.answer;
  chatHistory.messages.push({ role: 'user', content: message });
  chatHistory.messages.push({ role: 'assistant', content: assistantContent });
  await chatHistory.save();

  res.json({ historyId: chatHistory._id, ...answer });
});

const listChats = asyncHandler(async (req, res) => {
  const chats = await ChatHistory.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(20);
  res.json(chats);
});

module.exports = { getSuggestions, generateDietPlan, chat, listChats };
