const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/response');

/** Requires a valid `Authorization: Bearer <token>` header. */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication token missing'));
  }

  const token = header.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/** Use after `authenticate`. Example: requireRole('admin') */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do this'));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
