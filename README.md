# Quiz Platform - Phase 1-3

This repository currently implements **Section 7 - Phase 1, Phase 2, and Phase 3**:

- React client setup with Tailwind + shadcn/ui components for auth pages
- Express server setup with PostgreSQL connection and auth endpoints
- SQL schema for all 8 planned tables
- JWT-based teacher authentication (`register`, `login`, `me`)
- Client auth context with token rehydration and protected teacher routes
- Teacher dashboard shell with sidebar + profile footer
- Subject management (`GET/POST/DELETE /api/subjects`)
- Question management (`GET/POST/DELETE /api/questions`)
- Quiz listing with `search` and `status` filters (`GET /api/quizzes`)
- Generate mode modal (manual vs auto)
- Manual quiz creation page with question builder and math helper popup
- Auto-generate quiz page with subject + question count selection
- Quiz creation endpoints (`POST /api/quizzes/manual`, `POST /api/quizzes/auto-generate`)
- Quiz detail + update endpoints (`GET /api/quizzes/:id`, `PUT /api/quizzes/:id`)
- Quiz activation with shareable access link generation
- Excel bulk import endpoint (`POST /api/questions/bulk-import`) and client parser utility

## Project Structure

- `client/` - Vite React frontend
- `server/` - Express backend

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Server Setup

1. Copy env file:

```bash
cp server/.env.example server/.env
```

2. Update `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_URL` in `server/.env`.

3. Install dependencies:

```bash
cd server
npm install
```

4. Create schema:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

5. Run server:

```bash
npm run dev
```

Server runs on `http://localhost:5000` by default.

## Client Setup

1. Copy env file:

```bash
cp client/.env.example client/.env
```

2. Install dependencies:

```bash
cd client
npm install
```

3. Run client:

```bash
npm run dev
```

Client runs on `http://localhost:5173` by default.

## Implemented API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/subjects`
- `POST /api/subjects`
- `DELETE /api/subjects/:id`
- `GET /api/questions?subject_id=X`
- `POST /api/questions`
- `DELETE /api/questions/:id`
- `GET /api/quizzes?search=&status=`
- `POST /api/questions/bulk-import`
- `POST /api/quizzes/manual`
- `POST /api/quizzes/auto-generate`
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id`

## Notes

- Authentication is teacher-only in Phase 1.
- Token key in client localStorage: `quiz_token`.
- Phase 4+ features are intentionally not implemented yet.

## Note About Excel Parsing

Client-side Excel parsing uses the `xlsx` package. If not already installed in your environment, run:

```bash
cd client
npm install xlsx
```
