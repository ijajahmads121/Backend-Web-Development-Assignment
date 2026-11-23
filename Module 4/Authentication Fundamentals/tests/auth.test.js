const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const createApp = require('../src/app');
const prisma = require('../src/db/prisma');

const app = createApp();
let server;
let baseUrl;

before(async () => {
  await prisma.user.deleteMany();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.close();
    await once(server, 'close');
  }
  await prisma.$disconnect();
});

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { response, text, body: JSON.parse(text) };
}

test('registration rejects missing, blank, or incorrectly typed fields with 400', async () => {
  for (const body of [
    {},
    { name: 'Sam', email: 'sam@example.com' },
    { name: ' ', email: 'sam@example.com', password: 'pass' },
    { name: 'Sam', email: ' ', password: 'pass' },
    { name: 42, email: 'sam@example.com', password: 'pass' },
  ]) {
    const { response, body: payload } = await post('/auth/register', body);
    assert.equal(response.status, 400);
    assert.equal(payload.error.code, 'VALIDATION_ERROR');
  }
});

test('registration normalizes email, persists a verifiable hash, and returns only safe fields', async () => {
  const password = 'integration-test-only-passphrase';
  const { response, body } = await post('/auth/register', {
    name: '  Sam Example  ',
    email: '  SAM@Example.COM ',
    password,
  });

  assert.equal(response.status, 201);
  assert.deepEqual(Object.keys(body.data).sort(), ['email', 'id', 'name']);
  assert.deepEqual(body.data, {
    id: body.data.id,
    name: 'Sam Example',
    email: 'sam@example.com',
  });
  assert.equal(JSON.stringify(body).includes(password), false);
  assert.equal(JSON.stringify(body).toLowerCase().includes('passwordhash'), false);

  const stored = await prisma.user.findUnique({ where: { email: 'sam@example.com' } });
  assert.ok(stored);
  assert.notEqual(stored.passwordHash, password);
  assert.equal(await require('bcryptjs').compare(password, stored.passwordHash), true);
});

test('duplicate normalized email returns 409 without creating a second user', async () => {
  const { response, body } = await post('/auth/register', {
    name: 'Another Sam',
    email: 'Sam@Example.com',
    password: 'another-test-passphrase',
  });

  assert.equal(response.status, 409);
  assert.equal(body.error.code, 'EMAIL_EXISTS');
  assert.equal(await prisma.user.count({ where: { email: 'sam@example.com' } }), 1);
});

test('login normalizes email and returns a safe identity on valid credentials', async () => {
  const { response, body } = await post('/auth/login', {
    email: ' SAM@EXAMPLE.COM ',
    password: 'integration-test-only-passphrase',
  });

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(body.data).sort(), ['email', 'id', 'name']);
  assert.equal(body.data.email, 'sam@example.com');
  assert.equal(JSON.stringify(body).includes('integration-test-only-passphrase'), false);
  assert.equal(JSON.stringify(body).toLowerCase().includes('passwordhash'), false);
});

test('unknown email and wrong password produce byte-for-byte identical generic 401 JSON', async () => {
  const unknown = await post('/auth/login', {
    email: 'nobody@example.com',
    password: 'wrong-test-passphrase',
  });
  const wrong = await post('/auth/login', {
    email: 'sam@example.com',
    password: 'wrong-test-passphrase',
  });

  const expected = {
    error: {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    },
  };
  assert.equal(unknown.response.status, 401);
  assert.equal(wrong.response.status, 401);
  assert.equal(unknown.text, wrong.text);
  assert.deepEqual(unknown.body, expected);
});

test('malformed JSON receives a controlled 400 response', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid-json',
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' },
  });
});

test('unexpected internal details are not exposed to API clients', async () => {
  const internalApp = createApp({
    register: async () => {
      throw new Error('sensitive database connection detail');
    },
    login: async () => {
      throw new Error('sensitive bcrypt detail');
    },
  });
  const internalServer = internalApp.listen(0, '127.0.0.1');
  await once(internalServer, 'listening');
  const internalUrl = `http://127.0.0.1:${internalServer.address().port}`;

  try {
    const response = await fetch(`${internalUrl}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Safe', email: 'safe@example.com', password: 'test-only' }),
    });
    const text = await response.text();
    assert.equal(response.status, 500);
    assert.equal(text.includes('sensitive database connection detail'), false);
    assert.equal(text.includes('INTERNAL_ERROR'), true);
  } finally {
    internalServer.close();
    await once(internalServer, 'close');
  }
});
