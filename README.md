# Games Portal Platform Foundation

This repository contains a platform-first foundation for a web-based game portal with a React frontend, Express backend, and PostgreSQL persistence.

## Architecture

- `backend/` contains core platform APIs and modules:
  - `auth` (register/login/logout/me)
  - `users` (profile endpoint)
  - `economy` (coin transaction history)
  - `games` (generic game listing/session start/session completion)
- `frontend/` contains a minimal React app with routes for:
  - `/login`
  - `/register`
  - `/dashboard`
  - `/games`

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## 1) Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Backend runs on `http://localhost:3000`.

## 2) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Migration instructions

The initial migration is:

- `backend/migrations/001_initial_schema.sql`

Run migrations with:

```bash
cd backend
npm run migrate
```

## API surface

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### User
- `GET /user/me`

### Games
- `GET /games`
- `POST /games/:id/start`
- `POST /games/:id/complete`

### Economy
- `GET /economy/transactions`

## Security notes

- Passwords are hashed with bcrypt.
- Auth uses JWT in an `httpOnly` cookie.
- CORS is configured with credentials.
- Game completion uses server-side coin calculation (`score / 10`) with a TODO for anti-cheat hardening.
