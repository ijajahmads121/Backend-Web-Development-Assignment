# Introduction to Webhooks

This project implements `POST /webhooks` with HMAC-SHA256 verification, event-id deduplication, and an immediate acknowledgement before event processing. The route uses `express.raw()` so the signature is checked against the original request bytes.

## Run locally

Use Node.js 18 or newer, install dependencies, and set a development secret:

```bash
npm install
cp .env.example .env
# Set WEBHOOK_SECRET in your shell (or use a local environment loader).
export WEBHOOK_SECRET=supersecretkey
npm start
```

The in-memory processed-id set is intended for this exercise only. Production services should persist event IDs in a database with a unique constraint or in a shared Redis store, and should enqueue critical work for reliable retries.

## Tests

```bash
npm test
```

The suite covers valid, forged, and unsigned requests, duplicate-event handling, and the response-before-processing guarantee. Do not commit `.env` or `node_modules/`.
