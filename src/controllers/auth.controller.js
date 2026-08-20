const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repository');
const { signToken } = require('../utils/jwt');
const { ApiError, ok } = require('../utils/response');

/**
 * POST /api/auth/register
 * In production you'd usually restrict this to an existing admin
 * (see the `requireRole('admin')` note on the route). Kept open here
 * so you can create the very first account.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await userRepo.findByEmail(email);
    if (existing) throw new ApiError(409, 'An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ name, email, passwordHash, role });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    ok(res, { user, token }, 201);
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userRepo.findByEmail(email);
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password_hash, ...safeUser } = user;
    ok(res, { user: safeUser, token });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me - returns the logged-in staff user's profile. */
async function me(req, res, next) {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) throw new ApiError(404, 'User not found');
    ok(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
