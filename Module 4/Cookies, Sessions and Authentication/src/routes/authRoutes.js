const bcrypt = require('bcryptjs');
const express = require('express');
const requireSession = require('../middleware/requireSession');
const userRepository = require('../repositories/userRepository');
const sessionStore = require('../session/sessionStore');
const {
  COOKIE_NAME,
  sessionCookieOptions,
  clearSessionCookieOptions,
} = require('../config/session');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalidInput(res) {
  return res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message: 'A valid email and password are required' },
  });
}

function invalidCredentials(res) {
  return res.status(401).json({
    error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post('/login', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return invalidInput(res);

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email) || !password || password.length > 1024) {
      return invalidInput(res);
    }

    const user = await userRepository.findCredentialsByEmail(email);
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) return invalidCredentials(res);

    const session = sessionStore.create(user.id);
    res.cookie(COOKIE_NAME, session.id, sessionCookieOptions());
    return res.status(200).json({ data: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireSession, (req, res) => {
  return res.status(200).json({ data: req.user });
});

router.post('/logout', (req, res) => {
  const sessionId = req.signedCookies && req.signedCookies[COOKIE_NAME];
  if (typeof sessionId === 'string') sessionStore.destroy(sessionId);

  res.clearCookie(COOKIE_NAME, clearSessionCookieOptions());
  return res.status(204).end();
});

module.exports = router;
