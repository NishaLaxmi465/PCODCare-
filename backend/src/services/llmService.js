const ApiError = require('../utils/apiError');

function extractResponseText(payload) {
  if (payload.output_text) return payload.output_text;

  const output = payload.output || [];
  const textParts = output.flatMap((item) =>
    (item.content || [])
      .filter((content) => content.type === 'output_text' || content.type === 'text')
      .map((content) => content.text),
  );

  return textParts.join('\n').trim();
}

async function callLlm({ system, prompt, temperature = 0.4 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/responses';
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  if (!apiKey) {
    return null;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, payload.error?.message || 'LLM request failed');
  }

  return extractResponseText(payload);
}

function fallbackDietPlan(user, inputs = {}) {
  const dietaryPreference = inputs.dietaryPreference || user.profile?.dietaryPreference || 'balanced';
  const allergies = inputs.allergies || user.profile?.allergies || [];

  return {
    source: 'fallback',
    summary: `A PCOS-friendly ${dietaryPreference} plan focused on steady glucose, adequate protein, fiber, hydration, and anti-inflammatory foods.`,
    eat: [
      {
        food: 'High-fiber carbohydrates',
        examples: ['oats', 'millets', 'brown rice', 'whole wheat roti', 'beans'],
        benefits: 'Slower digestion can support insulin sensitivity and reduce energy crashes.',
      },
      {
        food: 'Lean protein',
        examples: ['dal', 'paneer/tofu', 'eggs', 'fish/chicken', 'Greek yogurt'],
        benefits: 'Protein helps satiety, muscle maintenance, and more stable meals.',
      },
      {
        food: 'Colorful vegetables and fruit',
        examples: ['leafy greens', 'berries', 'guava', 'cucumber', 'tomato'],
        benefits: 'Micronutrients and antioxidants support metabolic and hormone health.',
      },
    ],
    avoid: [
      {
        food: 'Sugary drinks and desserts',
        reason: 'They can raise glucose quickly and may worsen cravings.',
      },
      {
        food: 'Highly processed snacks',
        reason: 'Often low in fiber and high in refined starch, salt, and unhealthy fats.',
      },
      {
        food: 'Skipping meals',
        reason: 'Long gaps can trigger overeating and unstable energy.',
      },
    ],
    sampleDay: {
      breakfast: 'Vegetable oats or besan chilla with curd',
      lunch: 'Dal, salad, cooked vegetables, and millet roti or brown rice',
      snack: 'Fruit with nuts or roasted chana',
      dinner: 'Protein-rich bowl with vegetables and a small whole-grain portion',
      hydration: 'Water through the day; unsweetened herbal tea is fine.',
    },
    cautions: allergies.length ? [`Avoid known allergens: ${allergies.join(', ')}.`] : [],
  };
}

function fallbackChatAnswer(question) {
  return {
    source: 'fallback',
    answer:
      'I can help with PCOS tracking, nutrition ideas, cycle patterns, reminders, and appointment prep. For diagnosis, medication changes, severe pain, heavy bleeding, pregnancy concerns, or sudden symptoms, please contact a qualified clinician.',
    followUps: [
      'What patterns should I track for PCOS?',
      'How can I prepare for a gynecologist appointment?',
      'What foods support insulin sensitivity?',
    ],
    receivedQuestion: question,
  };
}

function parseJsonOrWrap(text, fallback) {
  if (!text) return fallback;

  try {
    return { source: 'llm', ...JSON.parse(text) };
  } catch (_error) {
    return { source: 'llm', text };
  }
}

module.exports = { callLlm, fallbackDietPlan, fallbackChatAnswer, parseJsonOrWrap };
