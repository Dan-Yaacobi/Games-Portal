# Games Portal Platform Foundation

This repository contains a platform-first foundation for a web-based game portal with a React frontend, Express backend, and PostgreSQL persistence.

## Architecture

- `backend/` contains core platform APIs and modules:
  - `auth` (register/login/logout/me)
  - `users` (profile endpoint)
  - `economy` (coin transaction history)
  - `games` (generic game listing/session start/session completion)
  - `wubbleWeb` (real game session generation + authoritative scoring)
- `frontend/` contains React app routes for:
  - `/login`
  - `/register`
  - `/dashboard`
  - `/games`
  - `/games/wubble-web`

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

Run migrations with:

```bash
cd backend
npm run migrate
```

## API surface

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### User
- `GET /api/user/me`

### Games
- `GET /api/games`
- `POST /api/games/:id/start`
- `POST /api/games/:id/complete`

### Wubble Web
- `POST /api/wubble-web/start`
- `POST /api/wubble-web/submit`

### Economy
- `GET /api/economy/transactions`

## Wubble Web implementation notes

### Schema

`backend/migrations/003_wubble_web.sql` adds:
- `word_categories`
- `words`
- `word_category_links`
- `wubble_sessions`
- `wubble_submissions`
- indexes for lookup paths used by generation/validation
- game registration seed for slug `wubble-web`

### Session flow

1. Frontend calls `POST /api/wubble-web/start` with `wordDifficulty`, `speedDifficulty`, and `durationSeconds` (`60` or `120`).
2. Backend resolves game slug `wubble-web`, creates/reuses platform `game_sessions` row, then generates:
   - prompt schedule (15–30 second windows for the selected game length)
   - full spawn plan (includes deterministic spawn metadata, categories, timing)
3. Backend persists generated data in `wubble_sessions` and returns client-safe payload.

### Validation flow

1. Client records click event log (`spawnId`, `timestampMs`) and submits at game end.
2. Backend validates:
   - ownership / session linkage
   - one submission per wubble session
   - timestamps in range
   - known spawn IDs
   - duplicate click abuse (duplicates rejected)
   - click timing within bubble lifetime
3. Backend computes authoritative score from generated prompt+spawn data.
4. Submission + platform completion + coin award are executed in one transaction.
5. Validation summary is persisted to `wubble_submissions.validation_summary_json`.

### Local play

1. Start backend/frontend.
2. Login/register.
3. Open `/games` and launch Wubble Web.
4. Play a round using either a 60-second or 120-second duration.
5. Final score and coin reward come from backend-validated submission (not provisional UI score).

## Security notes

- Passwords are hashed with bcrypt.
- Auth uses JWT in an `httpOnly` cookie.
- CORS is configured with credentials.
- Wubble Web scoring is server-authoritative and coins are awarded only from validated score.

## Vercel deployment notes

Set these environment variables in Vercel for both Preview and Production deployments:

- Set Vercel project **Root Directory** to the repository root (`.`), not `frontend`, so both `api/index.js` and `frontend/package.json` are included in the build.
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` (set to your frontend deployment origin, e.g. `https://<your-app>.vercel.app`)

Without `DATABASE_URL` and `JWT_SECRET`, the API function will fail to initialize.

For local frontend development, set `VITE_API_BASE_URL=/api` so requests go through the Vite proxy to the backend.

