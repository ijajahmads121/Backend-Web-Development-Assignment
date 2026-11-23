const express = require('express');
const createAuthController = require('../controllers/authController');
const { createAuthService } = require('../services/authService');

function createAuthRouter(authService = createAuthService()) {
  const router = express.Router();
  const controller = createAuthController(authService);

  router.post('/register', controller.register);
  router.post('/login', controller.login);

  return router;
}

module.exports = createAuthRouter;
