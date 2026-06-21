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

function fallbackChatAnswer(question = '') {
  const normalizedQuestion = question.toLowerCase();
  const clinicianNote =
    'This is general wellness information, not a diagnosis. Please contact a qualified clinician for severe symptoms, medication decisions, pregnancy concerns, or sudden changes.';

  const topicResponses = [
    {
      matches: ['diet', 'food', 'meal', 'eat', 'nutrition', 'insulin', 'spike', 'sugar'],
      answer:
        'For PCOS-friendly meals, focus on protein, fiber-rich carbohydrates, healthy fats, and vegetables in each meal. Try options like dal with roti and salad, vegetable oats with curd, eggs or paneer with vegetables, or a millet bowl with beans. Limit sugary drinks, refined snacks, and very long gaps between meals because they can worsen cravings and glucose swings.',
      followUps: [
        'Can you suggest a vegetarian PCOS meal plan?',
        'Which foods should I avoid for insulin resistance?',
        'What is a good PCOS breakfast?',
      ],
    },
    {
      matches: ['cycle', 'period', 'irregular', 'menstrual', 'bleeding', 'cramp'],
      answer:
        'For irregular cycles, track period start date, flow, pain level, spotting, missed periods, mood changes, acne, hair fall, sleep, and stress. Patterns over 2-3 months are often more useful than one isolated cycle. If bleeding is very heavy, pain is severe, or periods stop for several months, it is best to discuss it with a gynecologist.',
      followUps: [
        'What should I ask my doctor about irregular cycles?',
        'Which symptoms should I track with my period?',
        'When is irregular bleeding urgent?',
      ],
    },
    {
      matches: ['exercise', 'workout', 'walk', 'steps', 'gym', 'yoga', 'activity'],
      answer:
        'A balanced PCOS exercise routine usually combines regular walking or cardio, strength training, and flexibility work. A practical starting point is a daily walk, 2-3 days of strength exercises per week, and light stretching or yoga for stress support. Build gradually so the routine is sustainable.',
      followUps: [
        'How many steps are helpful for PCOS?',
        'Can strength training help PCOS?',
        'Give me a beginner workout plan.',
      ],
    },
    {
      matches: ['weight', 'bmi', 'gain', 'loss', 'fat', 'obesity'],
      answer:
        'With PCOS, weight changes can be influenced by insulin resistance, sleep, stress, activity, and meal patterns. Instead of focusing only on the scale, track waist changes, energy, cravings, steps, strength, cycle regularity, and symptoms. Small consistent habits are usually more effective than extreme diets.',
      followUps: [
        'How can I manage cravings with PCOS?',
        'What habits help insulin resistance?',
        'How should I track weight progress?',
      ],
    },
    {
      matches: ['acne', 'hair', 'skin', 'pimple', 'hairfall', 'hair fall', 'hirsutism'],
      answer:
        'Acne, hair fall, and unwanted facial hair can happen in PCOS because of hormone imbalance, especially androgen-related changes. Track when symptoms flare, cycle timing, stress, sleep, and diet changes. A dermatologist or gynecologist can help decide whether labs or treatment are needed.',
      followUps: [
        'What PCOS symptoms should I track weekly?',
        'Can diet affect acne in PCOS?',
        'What should I ask a dermatologist?',
      ],
    },
    {
      matches: ['doctor', 'appointment', 'gynecologist', 'gynaecologist', 'test', 'lab', 'medicine'],
      answer:
        'For a PCOS appointment, bring your cycle dates, symptom history, weight changes, current medicines, supplements, medical reports, and specific concerns. Useful questions include which tests are needed, whether insulin resistance should be checked, treatment options, lifestyle priorities, and when to follow up.',
      followUps: [
        'What tests are commonly discussed for PCOS?',
        'How do I prepare my symptom history?',
        'What questions should I ask about medication?',
      ],
    },
    {
      matches: ['trend', 'summary', 'analytics', 'report', 'track', 'tracking', 'dashboard'],
      answer:
        'Good PCOS tracking includes cycle dates, symptoms, mood, weight, water intake, exercise, steps, medication, and medical reports. Look for patterns across weeks, such as symptoms rising with poor sleep, missed workouts, high stress, or irregular meals. These patterns can make doctor visits much more productive.',
      followUps: [
        'What PCOS symptoms should I track every week?',
        'How can I summarize my data for a doctor?',
        'Which health trends matter most?',
      ],
    },
  ];

  const matchedTopic = topicResponses.find((topic) =>
    topic.matches.some((keyword) => normalizedQuestion.includes(keyword)),
  );

  if (matchedTopic) {
    return {
      source: 'fallback',
      answer: `${matchedTopic.answer} ${clinicianNote}`,
      followUps: matchedTopic.followUps,
      receivedQuestion: question,
    };
  }

  return {
    source: 'fallback',
    answer:
      `I can help with PCOS tracking, nutrition ideas, cycle patterns, exercise habits, reminders, reports, and appointment preparation. Ask me about your specific concern, such as diet, periods, acne, weight, workouts, or doctor questions. ${clinicianNote}`,
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
