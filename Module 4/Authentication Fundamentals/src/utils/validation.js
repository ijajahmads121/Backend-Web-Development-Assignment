const AppError = require('./AppError');

function requireObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object');
  }
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a non-empty string`);
  }
}

function validateRegister(body) {
  requireObject(body);
  requireNonEmptyString(body.name, 'name');
  requireNonEmptyString(body.email, 'email');
  requireNonEmptyString(body.password, 'password');
  if (body.name.trim().length === 0 || body.email.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'name and email must not be blank');
  }
  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };
}

function validateLogin(body) {
  requireObject(body);
  requireNonEmptyString(body.email, 'email');
  requireNonEmptyString(body.password, 'password');
  if (body.email.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'email must not be blank');
  }
  return {
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };
}

module.exports = { validateRegister, validateLogin };
