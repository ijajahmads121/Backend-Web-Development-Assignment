# Authentication Fundamentals API

A small Express 5 and Prisma API demonstrating safe account registration and login. It stores only asynchronous `bcryptjs` password hashes, compares passwords with `bcrypt.compare`, returns an explicit public-user allowlist, and uses one generic response for unknown-email and wrong-password failures. Sessions and JWTs are intentionally out of scope.

## Requirements

- Node.js 18 or newer
- npm

## Setup

From this directory:

```bash
cp .env.example .env
npm install
npm run setup
npm test
npm run dev
```

`npm run setup` generates the Prisma client and creates/updates the local SQLite database. The `npm test` script creates a separate temporary database, runs the integration suite against the real Prisma repository, then removes the test database. Keep `.env` local; only the safe `.env.example` is committed.

The API listens on `http://localhost:3000` by default. Set `PORT` in `.env` to use another port.

## Endpoints

### `POST /auth/register`

Request:

```json
{
  "name": "Sam Example",
  "email": "sam@example.com",
  "password": "a-long-demo-passphrase"
}
```

- Requires non-empty string values for `name`, `email`, and `password`.
- Trims the name and normalizes the email with `trim().toLowerCase()`.
- Hashes the password asynchronously before persistence. The database has a unique constraint on email; duplicate addresses return `409` even if concurrent requests race.
- Returns `201` with only `{ "data": { "id", "name", "email" } }`.

### `POST /auth/login`

Request:

```json
{
  "email": "SAM@example.com",
  "password": "a-long-demo-passphrase"
}
```

A valid login returns `200` with the same safe identity shape. An unknown email and an incorrect password both return `401` with exactly this JSON body:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

The missing-account path performs a bcrypt comparison against a valid, process-local dummy hash, so it does not skip the expensive password verification step. The random dummy password and its hash are never persisted, logged, or committed.

Malformed input returns `400`; an email conflict returns `409`; unexpected errors return a controlled `500` response without database or bcrypt details. Authentication only establishes identity; no authorization rules, JWT, or session behavior are implemented.

## Example requests

```bash
curl -i http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sam Example","email":"sam@example.com","password":"a-long-demo-passphrase"}'

curl -i http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"SAM@example.com","password":"a-long-demo-passphrase"}'
```

## Project structure

```text
src/
  app.js                 Express app factory and controlled error handling
  server.js              HTTP server entry point
  controllers/            HTTP request/response handling
  repositories/           Prisma-only user persistence functions
  routes/                 /auth route wiring
  services/               Registration and login workflows
  utils/                  Safe errors and public-user serializer
prisma/schema.prisma      Unique email and passwordHash model
scripts/test.js           Isolated test database runner
tests/auth.test.js        HTTP + real Prisma integration tests
```
