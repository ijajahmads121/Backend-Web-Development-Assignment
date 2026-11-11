const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const app = require('../src/app');
const eventHandlers = require('../src/eventHandlers');
const { handleWebhook, _processedIds } = require('../src/webhookHandler');

const SECRET = 'supersecretkey';
process.env.WEBHOOK_SECRET = SECRET;

function sign(body) {
  return `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
}

function responseStub() {
  return {
    statusCode: null,
    payload: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      this.headersSent = true;
      return this;
    },
  };
}

function test(name, fn) {
  return { name, fn };
}

async function run() {
  const handled = [];
  eventHandlers.handleEvent = async (event) => {
    handled.push(event);
  };

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function send(event, signature = 'valid') {
    const body = Buffer.from(JSON.stringify(event));
    const headers = { 'content-type': 'application/json' };
    if (signature === 'valid') headers['x-webhook-signature'] = sign(body);
    if (signature === 'invalid') headers['x-webhook-signature'] = `sha256=${'0'.repeat(64)}`;
    return fetch(`${baseUrl}/webhooks`, { method: 'POST', headers, body });
  }

  const tests = [
    test('valid HMAC signature is accepted', async () => {
      _processedIds.clear();
      handled.length = 0;
      const response = await send({ id: 'evt-valid', type: 'payment.succeeded' });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: 'received' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.deepEqual(handled.map((event) => event.id), ['evt-valid']);
    }),
    test('forged signature is rejected with 401', async () => {
      _processedIds.clear();
      handled.length = 0;
      const response = await send({ id: 'evt-forged' }, 'invalid');
      assert.equal(response.status, 401);
      assert.equal(_processedIds.has('evt-forged'), false);
      assert.equal(handled.length, 0);
    }),
    test('missing signature is rejected with 401', async () => {
      _processedIds.clear();
      const response = await send({ id: 'evt-unsigned' }, 'missing');
      assert.equal(response.status, 401);
      assert.equal(_processedIds.has('evt-unsigned'), false);
    }),
    test('a repeated event id is acknowledged without processing twice', async () => {
      _processedIds.clear();
      handled.length = 0;
      const event = { id: 'evt-replay', type: 'payment.succeeded' };
      const first = await send(event);
      assert.equal(first.status, 200);
      assert.deepEqual(await first.json(), { status: 'received' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const replay = await send(event);
      assert.equal(replay.status, 200);
      assert.deepEqual(await replay.json(), { status: 'already_processed' });
      assert.equal(handled.length, 1);
    }),
    test('new event is marked before work and work runs after acknowledgement', async () => {
      _processedIds.clear();
      let responseWasSentWhenProcessed = false;
      const event = { id: 'evt-new', type: 'payment.succeeded' };
      const rawBody = Buffer.from(JSON.stringify(event));
      const req = {
        body: rawBody,
        headers: { 'x-webhook-signature': sign(rawBody) },
      };
      const res = responseStub();
      eventHandlers.handleEvent = async () => {
        responseWasSentWhenProcessed = res.headersSent;
      };

      handleWebhook(req, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.payload, { status: 'received' });
      assert.equal(_processedIds.has('evt-new'), true);
      assert.equal(responseWasSentWhenProcessed, false);

      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(responseWasSentWhenProcessed, true);
    }),
  ];

  let passed = 0;
  let failed = 0;
  try {
    for (const item of tests) {
      try {
        await item.fn();
        passed += 1;
        console.log(`✓ ${item.name}`);
      } catch (error) {
        failed += 1;
        console.error(`✗ ${item.name}`);
        console.error(error);
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
