# Quiz Platform

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


## Note About Excel Parsing

Client-side Excel parsing uses the `xlsx` package. If not already installed in your environment, run:

```bash
cd client
npm install xlsx
```
