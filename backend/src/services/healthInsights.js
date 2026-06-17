const SymptomLog = require('../models/SymptomLog');
const WeightLog = require('../models/WeightLog');
const WaterLog = require('../models/WaterLog');
const ExerciseLog = require('../models/ExerciseLog');
const StepLog = require('../models/StepLog');
const MoodLog = require('../models/MoodLog');

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function stdDev(values) {
  const mean = average(values);
  if (mean === null || values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, precision = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return weightKg / heightM ** 2;
}

function analyzeCycle(cycleLengths) {
  const values = cycleLengths.filter((value) => Number.isFinite(value) && value >= 10 && value <= 120);

  if (values.length < 3) {
    return {
      status: 'unknown',
      mean: values.length ? round(average(values)) : null,
      stdDev: values.length > 1 ? round(stdDev(values)) : null,
      sampleSize: values.length,
      irregular: false,
      message: 'Add at least three cycle lengths to detect irregularity.',
    };
  }

  const mean = average(values);
  const deviation = stdDev(values);
  const outsideTypicalRange = values.filter((value) => value < 21 || value > 35).length / values.length;
  const irregular = deviation > 7 || mean < 21 || mean > 35 || outsideTypicalRange >= 0.3;

  return {
    status: irregular ? 'irregular' : 'regular',
    mean: round(mean),
    stdDev: round(deviation),
    sampleSize: values.length,
    irregular,
    message: irregular
      ? 'Cycle lengths vary enough to be considered irregular. Consider discussing this pattern with a clinician.'
      : 'Cycle lengths are currently within the expected consistency range.',
  };
}

function riskCategory(score) {
  if (score >= 67) return 'High';
  if (score >= 34) return 'Moderate';
  return 'Low';
}

function buildRecommendations({ bmi, symptomAverage, cycleAnalysis, avgSteps, weightTrendPercent }) {
  const recommendations = [];

  if (bmi >= 25) {
    recommendations.push('Prioritize steady weight management with protein-rich meals, strength training, and clinician-guided goals.');
  }

  if (symptomAverage >= 5) {
    recommendations.push('Track acne, hair fall, cramps, and fatigue daily so flare patterns are easier to discuss during appointments.');
  }

  if (cycleAnalysis.irregular) {
    recommendations.push('Share cycle-length history with your doctor, especially if cycles are frequently under 21 or over 35 days.');
  }

  if (avgSteps !== null && avgSteps < 7000) {
    recommendations.push('Build toward a sustainable step target with short post-meal walks and gentle activity breaks.');
  }

  if (weightTrendPercent > 1) {
    recommendations.push('Review recent weight gain alongside sleep, stress, medication adherence, and nutrition patterns.');
  }

  if (!recommendations.length) {
    recommendations.push('Keep logging consistently. Current trends look stable, and more data will make insights sharper.');
  }

  return recommendations;
}

async function computeHealthInsights(user) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [latestWeight, weightLogs, symptomLogs, stepLogs] = await Promise.all([
    WeightLog.findOne({ user: user._id }).sort({ date: -1 }),
    WeightLog.find({ user: user._id, date: { $gte: ninetyDaysAgo, $lte: now } }).sort({ date: 1 }),
    SymptomLog.find({ user: user._id, date: { $gte: ninetyDaysAgo, $lte: now } }).sort({ date: -1 }),
    StepLog.find({ user: user._id, date: { $gte: thirtyDaysAgo, $lte: now } }).sort({ date: -1 }),
  ]);

  const bmi = calculateBmi(user.profile?.heightCm, latestWeight?.weightKg);
  const cycleLengths = symptomLogs.map((log) => log.cycleLengthDays).filter(Boolean);
  if (user.profile?.averageCycleLength) {
    cycleLengths.push(user.profile.averageCycleLength);
  }
  const cycleAnalysis = analyzeCycle(cycleLengths);

  const symptomAverage = average(
    symptomLogs.flatMap((log) => [
      log.cramps,
      log.acne,
      log.hairFall,
      log.moodSwings,
      log.bloating,
      log.fatigue,
    ]),
  );
  const acneAverage = average(symptomLogs.map((log) => log.acne));
  const hairFallAverage = average(symptomLogs.map((log) => log.hairFall));
  const avgSteps = average(stepLogs.map((log) => log.steps));

  let weightTrendPercent = 0;
  if (weightLogs.length >= 2) {
    const first = weightLogs[0].weightKg;
    const last = weightLogs[weightLogs.length - 1].weightKg;
    weightTrendPercent = ((last - first) / first) * 100;
  }

  const contributors = [];
  let score = 0;

  if (bmi === null) {
    score += 8;
    contributors.push({ label: 'BMI', points: 8, detail: 'Height or recent weight is missing.' });
  } else if (bmi >= 35) {
    score += 25;
    contributors.push({ label: 'BMI', points: 25, detail: `BMI is ${round(bmi)}.` });
  } else if (bmi >= 30) {
    score += 22;
    contributors.push({ label: 'BMI', points: 22, detail: `BMI is ${round(bmi)}.` });
  } else if (bmi >= 25) {
    score += 15;
    contributors.push({ label: 'BMI', points: 15, detail: `BMI is ${round(bmi)}.` });
  } else if (bmi < 18.5) {
    score += 10;
    contributors.push({ label: 'BMI', points: 10, detail: `BMI is ${round(bmi)}.` });
  } else {
    score += 4;
    contributors.push({ label: 'BMI', points: 4, detail: `BMI is ${round(bmi)}.` });
  }

  const symptomPoints = symptomAverage === null ? 5 : Math.round(clamp(symptomAverage * 2.2, 0, 22));
  score += symptomPoints;
  contributors.push({
    label: 'Symptoms',
    points: symptomPoints,
    detail: symptomAverage === null ? 'No recent symptom logs.' : `Average symptom intensity is ${round(symptomAverage)}/10.`,
  });

  const acnePoints = acneAverage >= 6 ? 5 : acneAverage >= 3 ? 2 : 0;
  const hairFallPoints = hairFallAverage >= 6 ? 5 : hairFallAverage >= 3 ? 2 : 0;
  score += acnePoints + hairFallPoints;
  if (acnePoints) contributors.push({ label: 'Acne', points: acnePoints, detail: `Average acne severity is ${round(acneAverage)}/10.` });
  if (hairFallPoints) contributors.push({ label: 'Hair fall', points: hairFallPoints, detail: `Average hair fall severity is ${round(hairFallAverage)}/10.` });

  const cyclePoints = cycleAnalysis.status === 'unknown' ? 5 : cycleAnalysis.irregular ? 20 : 3;
  score += cyclePoints;
  contributors.push({
    label: 'Cycle regularity',
    points: cyclePoints,
    detail: cycleAnalysis.message,
  });

  const stepPoints = avgSteps === null ? 6 : avgSteps < 4000 ? 15 : avgSteps < 7000 ? 8 : 2;
  score += stepPoints;
  contributors.push({
    label: 'Steps',
    points: stepPoints,
    detail: avgSteps === null ? 'No recent step logs.' : `Average daily steps are ${Math.round(avgSteps)}.`,
  });

  const weightPoints = weightTrendPercent > 3 ? 10 : weightTrendPercent > 1 ? 5 : 1;
  score += weightPoints;
  contributors.push({
    label: 'Weight trend',
    points: weightPoints,
    detail: weightLogs.length < 2 ? 'Add more weight logs for a trend.' : `90-day trend is ${round(weightTrendPercent)}%.`,
  });

  const normalizedScore = clamp(Math.round(score), 0, 100);

  return {
    score: normalizedScore,
    category: riskCategory(normalizedScore),
    bmi: round(bmi),
    latestWeightKg: latestWeight?.weightKg || null,
    cycleAnalysis,
    averages: {
      symptoms: round(symptomAverage),
      acne: round(acneAverage),
      hairFall: round(hairFallAverage),
      steps: avgSteps === null ? null : Math.round(avgSteps),
    },
    weightTrendPercent: round(weightTrendPercent),
    contributors,
    recommendations: buildRecommendations({
      bmi,
      symptomAverage,
      cycleAnalysis,
      avgSteps,
      weightTrendPercent,
    }),
    generatedAt: new Date(),
  };
}

async function buildAnalytics(user, from, to) {
  const rangeFilter = { user: user._id, date: { $gte: from, $lte: to } };
  const [weights, waters, exercises, steps, symptoms, moods] = await Promise.all([
    WeightLog.find(rangeFilter).sort({ date: 1 }),
    WaterLog.find(rangeFilter).sort({ date: 1 }),
    ExerciseLog.find(rangeFilter).sort({ date: 1 }),
    StepLog.find(rangeFilter).sort({ date: 1 }),
    SymptomLog.find(rangeFilter).sort({ date: 1 }),
    MoodLog.find(rangeFilter).sort({ date: 1 }),
  ]);

  const heightCm = user.profile?.heightCm;

  return {
    steps: steps.map((item) => ({
      date: item.date,
      steps: item.steps,
      calories: item.caloriesBurned,
    })),
    weight: weights.map((item) => ({
      date: item.date,
      weightKg: item.weightKg,
      bmi: round(calculateBmi(heightCm, item.weightKg)),
    })),
    water: waters.map((item) => ({
      date: item.date,
      volumeMl: item.volumeMl,
      targetMl: item.targetMl,
    })),
    exercise: exercises.map((item) => ({
      date: item.date,
      minutes: item.minutes,
      calories: item.caloriesBurned,
      activity: item.activity,
    })),
    symptoms: symptoms.map((item) => ({
      date: item.date,
      cramps: item.cramps,
      acne: item.acne,
      hairFall: item.hairFall,
      moodSwings: item.moodSwings,
      fatigue: item.fatigue,
      bloating: item.bloating,
    })),
    mood: moods.map((item) => ({
      date: item.date,
      stressLevel: item.stressLevel,
      sleepHours: item.sleepHours,
      mood: item.mood,
    })),
  };
}

module.exports = { computeHealthInsights, buildAnalytics, analyzeCycle, calculateBmi };
