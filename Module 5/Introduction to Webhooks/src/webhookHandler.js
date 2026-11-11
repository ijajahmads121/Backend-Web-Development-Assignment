const crypto = require('node:crypto');
const eventHandlers = require('./eventHandlers');

const _processedIds = new Set();

function hasValidSignature(rawBody, signatureHeader, secret) {
  if (!Buffer.isBuffer(rawBody) || typeof signatureHeader !== 'string' || !secret) {
    return false;
  }

  // Require exactly 32 bytes of hexadecimal SHA-256 output before decoding.
  const match = /^sha256=([a-f0-9]{64})$/i.exec(signatureHeader);
  if (!match) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest();
  const received = Buffer.from(match[1], 'hex');

  // timingSafeEqual throws for buffers of different lengths, so length-check first.
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
}

function handleWebhook(req, res) {
  const valid = hasValidSignature(
    req.body,
    req.headers['x-webhook-signature'],
    process.env.WEBHOOK_SECRET,
  );

  if (!valid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (
    !event ||
    typeof event !== 'object' ||
    !['string', 'number'].includes(typeof event.id) ||
    String(event.id).length === 0
  ) {
    return res.status(400).json({ error: 'A valid event id is required' });
  }

  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  // Record the id before acknowledging or scheduling work to make retries harmless.
  _processedIds.add(event.id);
  res.status(200).json({ status: 'received' });

  // Keep slow work off the response path. Failures are logged for operational follow-up.
  setImmediate(() => {
    Promise.resolve()
      .then(() => eventHandlers.handleEvent(event))
      .catch((error) => {
        console.error('Webhook event processing failed:', error);
      });
  });
}

module.exports = { handleWebhook, _processedIds };
