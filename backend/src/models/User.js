const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    dateOfBirth: Date,
    phone: { type: String, trim: true },
    heightCm: { type: Number, min: 80, max: 250 },
    targetWeightKg: { type: Number, min: 25, max: 250 },
    diagnosisDate: Date,
    lastPeriodStart: Date,
    averageCycleLength: { type: Number, min: 10, max: 90 },
    conditions: [{ type: String, trim: true }],
    allergies: [{ type: String, trim: true }],
    dietaryPreference: {
      type: String,
      enum: ['balanced', 'vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
      default: 'balanced',
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active'],
      default: 'light',
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'clinician', 'admin'], default: 'user' },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function toJSON() {
  const value = this.toObject();
  delete value.passwordHash;
  return value;
};

module.exports = mongoose.model('User', userSchema);
