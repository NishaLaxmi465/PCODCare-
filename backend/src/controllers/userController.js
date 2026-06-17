const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'profile'];
  const updates = {};

  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, nextPassword } = req.body;

  if (!currentPassword || !nextPassword) {
    throw new ApiError(400, 'Current and new passwords are required');
  }

  if (nextPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id);
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(nextPassword, 12);
  await user.save();

  res.status(204).send();
});

module.exports = { getProfile, updateProfile, changePassword };
