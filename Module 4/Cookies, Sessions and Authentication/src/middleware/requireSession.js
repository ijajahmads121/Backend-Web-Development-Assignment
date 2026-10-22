const { COOKIE_NAME } = require('../config/session');
const sessionStore = require('../session/sessionStore');
const userRepository = require('../repositories/userRepository');

function authRequired(res) {
  return res.status(401).json({
    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
  });
}

module.exports = async function requireSession(req, res, next) {
  try {
    const sessionId = req.signedCookies && req.signedCookies[COOKIE_NAME];
    // cookie-parser returns false for a cookie with an invalid signature.
    if (typeof sessionId !== 'string') return authRequired(res);

    const session = sessionStore.get(sessionId);
    if (!session) return authRequired(res);

    const user = await userRepository.findPublicById(session.userId);
    if (!user) {
      sessionStore.destroy(sessionId);
      return authRequired(res);
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
