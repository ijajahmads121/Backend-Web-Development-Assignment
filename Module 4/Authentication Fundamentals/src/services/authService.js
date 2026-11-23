const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const defaultUserRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const toPublicUser = require('../utils/publicUser');
const { validateRegister, validateLogin } = require('../utils/validation');

const SALT_ROUNDS = 10;
const DUMMY_PASSWORD = randomBytes(32).toString('hex');
// Generate a valid, process-local dummy hash once; neither value is persisted or logged.
const DUMMY_HASH_PROMISE = bcrypt.hash(DUMMY_PASSWORD, SALT_ROUNDS);

function emailExistsError() {
  return new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
}

function invalidCredentialsError() {
  return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}

function createAuthService(userRepository = defaultUserRepository) {
  async function register(body) {
    const input = validateRegister(body);

    if (await userRepository.findByEmail(input.email)) {
      throw emailExistsError();
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    try {
      const user = await userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });
      return toPublicUser(user);
    } catch (error) {
      // The database unique index remains the final guard against concurrent signups.
      if (error && error.code === 'P2002') throw emailExistsError();
      throw error;
    }
  }

  async function login(body) {
    const input = validateLogin(body);
    // All login attempts await the same one-time setup work before looking up the account.
    const dummyHash = await DUMMY_HASH_PROMISE;
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      await bcrypt.compare(input.password, dummyHash);
      throw invalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw invalidCredentialsError();

    return toPublicUser(user);
  }

  return { register, login };
}

module.exports = { createAuthService };
