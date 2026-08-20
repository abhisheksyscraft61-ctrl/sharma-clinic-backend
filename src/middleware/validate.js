const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/response');

/** Put this after your express-validator chains on any route. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError(422, 'Validation failed', errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })))
    );
  }
  next();
}

module.exports = { validate };
