require('dotenv').config();
const express = require('express');
const createAuthRouter = require('./routes/authRoutes');
const AppError = require('./utils/AppError');

function createApp(authService) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/auth', createAuthRouter(authService));

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error && error.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      });
    }
    if (error && error.type === 'entity.too.large') {
      return res.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
      });
    }
    if (error instanceof AppError) {
      return res.status(error.status).json({
        error: { code: error.code, message: error.message },
      });
    }

    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });

  return app;
}

module.exports = createApp;
