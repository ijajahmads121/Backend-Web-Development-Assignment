const express = require('express');
const { handleWebhook } = require('./webhookHandler');

const app = express();

// The webhook signature covers the exact bytes received, so this route must use
// express.raw() before any JSON body parser can consume the request stream.
app.post('/webhooks', express.raw({ type: 'application/json' }), handleWebhook);

// Other routes may use parsed JSON bodies.
app.use(express.json());
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
  });
}

module.exports = app;
