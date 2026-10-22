const { randomBytes } = require('node:crypto');
const { SESSION_TTL_MS } = require('../config/session');

const sessions = new Map();

function removeExpiredSessions(now = Date.now()) {
  for (const [id, session] of sessions) {
    if (session.expiresAt.getTime() <= now) sessions.delete(id);
  }
}

function create(userId) {
  removeExpiredSessions();

  let id;
  do {
    // 256 bits from the operating system CSPRNG; the ID carries no user data.
    id = randomBytes(32).toString('base64url');
  } while (sessions.has(id));

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  sessions.set(id, { userId, expiresAt });
  return { id, expiresAt };
}

function get(id) {
  if (typeof id !== 'string' || id.length === 0) return undefined;

  removeExpiredSessions();
  return sessions.get(id);
}

function destroy(id) {
  if (typeof id === 'string') sessions.delete(id);
}

module.exports = { create, get, destroy };
