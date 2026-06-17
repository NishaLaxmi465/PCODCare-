const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  tokenHash,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');

function publicAuthPayload(user, refreshToken) {
  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

async function persistRefreshToken(user, refreshTokenMeta, req, replacedByTokenHash = undefined) {
  const hash = tokenHash(refreshTokenMeta.token);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hash,
    jti: refreshTokenMeta.jti,
    expiresAt: refreshTokenMeta.expiresAt,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    replacedByTokenHash,
  });

  return hash;
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, profile = {} } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, profile });
  const refreshTokenMeta = signRefreshToken(user);
  await persistRefreshToken(user, refreshTokenMeta, req);

  res.status(201).json(publicAuthPayload(user, refreshTokenMeta.token));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const refreshTokenMeta = signRefreshToken(user);
  await persistRefreshToken(user, refreshTokenMeta, req);

  res.json(publicAuthPayload(user, refreshTokenMeta.token));
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(401, 'Refresh token is invalid or expired');
  }

  const hash = tokenHash(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash: hash, jti: payload.jti });
  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token has been revoked');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  const refreshTokenMeta = signRefreshToken(user);
  const nextHash = tokenHash(refreshTokenMeta.token);

  storedToken.revokedAt = new Date();
  storedToken.replacedByTokenHash = nextHash;
  await storedToken.save();
  await persistRefreshToken(user, refreshTokenMeta, req);

  res.json(publicAuthPayload(user, refreshTokenMeta.token));
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { tokenHash: tokenHash(refreshToken), user: req.user._id },
      { revokedAt: new Date() },
    );
  }

  res.status(204).send();
});

module.exports = { register, login, refresh, logout };
