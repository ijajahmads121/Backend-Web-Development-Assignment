const configuredTtl = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000);

if (!Number.isSafeInteger(configuredTtl) || configuredTtl <= 0) {
  throw new Error('SESSION_TTL_MS must be a positive integer');
}

const SESSION_TTL_MS = configuredTtl;
const COOKIE_NAME = 'sid';

function cookieScopeOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    signed: true,
    path: '/',
  };
}

function sessionCookieOptions() {
  return { ...cookieScopeOptions(), maxAge: SESSION_TTL_MS };
}

function clearSessionCookieOptions() {
  // clearCookie needs the same scope and security attributes as cookie creation.
  return cookieScopeOptions();
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_MS,
  sessionCookieOptions,
  clearSessionCookieOptions,
};
