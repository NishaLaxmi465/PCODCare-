const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function requiredEnv(name, fallback) {
  const value = process.env[name] || (process.env.NODE_ENV === 'production' ? undefined : fallback);
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseExpiry(value) {
  const match = /^(\d+)([smhd])$/.exec(value || '7d');
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = Number(match[1]);
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + amount * multipliers[match[2]]);
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    requiredEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' },
  );
}

function signRefreshToken(user, jti = crypto.randomUUID()) {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const token = jwt.sign(
    { sub: user._id.toString(), jti },
    requiredEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    { expiresIn },
  );

  return { token, jti, expiresAt: parseExpiry(expiresIn) };
}

function verifyAccessToken(token) {
  return jwt.verify(token, requiredEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'));
}

function verifyRefreshToken(token) {
  return jwt.verify(token, requiredEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'));
}

module.exports = {
  tokenHash,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
