# LU48 — Cookies, Sessions and Authentication

An Express and Prisma API that authenticates with a signed, opaque cookie identifier and a server-side session record. The browser receives no user record or credential data.

## Requirements

- Node.js 18 or newer and npm.
- SQLite is used for the local Prisma database; no separate database service is needed.

## Setup and seed

Run these commands from this project directory:

```bash
cp .env.example .env
npm install
```

Set `COOKIE_SECRET` in `.env` to a unique, random secret of at least 32 characters. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Never commit `.env` or reuse the example placeholder in a deployed environment.

Initialize Prisma Client, create/update the local SQLite schema, and seed the demo user:

```bash
npm run setup
```

The seeded local-only demo account is `sam@example.com` / `SessionDemo!48`.

## Run

```bash
npm run dev
# or, without watch mode:
npm start
```

The API listens on `http://localhost:3000` by default. Configure the port with `PORT`.

## API contract

### `POST /auth/login`

Request JSON:

```json
{"email":"sam@example.com","password":"SessionDemo!48"}
```

The email is trimmed and lowercased, and the password is verified asynchronously with bcrypt. A successful login returns `200` with only `{ id, name, email }` and sets a signed `sid` cookie. Unknown email and incorrect password use the same generic `401` response. Invalid request fields receive a generic `400` validation response.

Cookie attributes are centralized: `HttpOnly`, `SameSite=Lax`, `Path=/`, signed with `COOKIE_SECRET`, and an expiration matching `SESSION_TTL_MS`. `Secure` is enabled whenever `NODE_ENV=production` or `COOKIE_SECURE=true`; keep it false only for local plain-HTTP testing. Production deployments must use HTTPS.

### `GET /auth/me`

Resolves `req.signedCookies.sid`, looks up the live server-side session, and then loads safe user fields through the repository. A valid session returns `200` with `{ id, name, email }`. Missing, modified, unknown, expired, or orphaned sessions all return the same generic `401 AUTH_REQUIRED` response.

### `POST /auth/logout`

Deletes the server-side record when present and clears the `sid` cookie using the same scope and security attributes as login. It returns `204` even when repeated or called without a valid session. Replaying a cookie after logout cannot restore the deleted session.

## Verify with curl

Start the API in one terminal, then run the following from this project directory in another:

```bash
# Login; inspect the Set-Cookie headers and save the signed cookie.
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"sam@example.com","password":"SessionDemo!48"}' \
  http://localhost:3000/auth/login

# The cookie jar authenticates the protected identity route.
curl -i -b cookies.txt http://localhost:3000/auth/me

# No cookie is rejected with generic JSON 401.
curl -i http://localhost:3000/auth/me

# Logout revokes the server record and returns a clearing Set-Cookie.
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout

# The old cookie jar no longer authenticates.
curl -i -b cookies.txt http://localhost:3000/auth/me
```

For a tampering check, copy the cookie value from `cookies.txt`, change one character, and send it as a `Cookie: sid=...` header to `/auth/me`; the response must be the same generic `401`. Repeat login with `NODE_ENV=production` (and serve it over HTTPS) to verify that `Set-Cookie` includes `Secure`.

Remove the local database and cookie jar when finished:

```bash
rm -f prisma/dev.db prisma/dev.db-journal cookies.txt
```

## Session storage note

The included `Map`-based session store is intentionally for learning and local execution only. It loses all sessions on process restart and cannot coordinate multiple server processes. Production should use a shared expiring store such as Redis, with server-side TTLs and reliable revocation. The cookie remains an opaque reference; the server-side record is the source of identity and authorization.
