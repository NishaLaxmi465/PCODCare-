const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');

const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication token is required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new ApiError(401, 'Access token is invalid or expired');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  req.user = user;
  next();
});

module.exports = requireAuth;
