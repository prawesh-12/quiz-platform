# QuizLoom — Architecture & Run Guide

QuizLoom runs as six independent services behind an Nginx gateway, each owning its own
database and communicating over Redis Streams (plus one internal HTTP call). This guide
explains the architecture, then takes you from a clone to a running system step by step.

---

## 1. Architecture at a glance

The SPA is served from Vercel (prod) or the Vite dev server at `:5173` (local). The gateway
is purely an API router.

```
                          Browser
                             |
                     http://localhost:8080
                             v
                  +---------------------+
                  |   gateway (nginx)   |  routes /api/* by path (API-only)
                  +----------+----------+
                             |
   +-----------+-------------+------------+-------------+-----------+
   |           |             |            |             |           |
 auth     questionbank      quiz        exam       analytics    (scheduler)
   |           |             |            |             |           |
 auth-db    qbank-db       quiz-db     exam-db      analytics-db   (no db)
   \___________\____________\___________/____________/___________/
                             |
                       Redis (event bus + cache)
```

| Service | Port (PM2) | Owns / database | Responsibility |
| --- | --- | --- | --- |
| **gateway** | 8080 | — | Nginx: routes `/api/*` to services (API-only; SPA served separately) |
| **auth** | 5001 | `auth-service-db` (teachers, revoked_tokens, teacher_subjects) | Login, JWT, teacher management, avatars |
| **questionbank** | 5002 | `questionbank-service-db` (subjects, units, questions) | Subjects/units/questions, internal question selection |
| **quiz** | 5003 | `quiz-service-db` (quizzes, quiz_questions, quiz_inline_questions) | Quiz CRUD, scheduling, snapshot source, quiz-history |
| **exam** | 5005 | `exam-service-db` (student_sessions, student_answers, violation_flags, quiz_snapshot) | Live exam: entry, scoring, violations, monitoring views |
| **analytics** | 5004 | `analytics-service-db` (event-built read-models) | Teacher/admin dashboards |
| **scheduler** | — | none (reads the quiz database) | Detects due quizzes, emits timer signals |
| **redis** | 6379 | — | Event bus (Redis Streams) + cache/denylist |

Each service runs migrations on boot and exposes `GET /api/health` and `GET /api/ready`.
The **exam** service additionally has a separate worker process (`worker.js`) that runs its
event consumers and the batch auto-submit.

---

## 2. How services communicate

Two mechanisms only:

**Redis Streams (async, the default).** A service publishes a domain event; interested
services consume it and update their own data. Streams, producers, and consumers:

| Stream | Produced by | Events | Consumed by |
| --- | --- | --- | --- |
| `events:auth` | auth | `teacher.upserted`, `teacher.deleted`, `teacher_subjects.assigned/removed` | quiz, questionbank |
| `events:questionbank` | questionbank | `subject.upserted`, `subject.deleted` | quiz, exam, analytics |
| `events:scheduler` | scheduler | `quiz.start_due`, `quiz.end_due`, `quiz.prewarm_due` | quiz |
| `events:quiz` | quiz | `quiz.upserted`, `quiz.snapshot`, `quiz.ended`, `quiz.deleted` | exam, analytics |
| `events:session` | exam | `session.started`, `session.submitted` | analytics |
| `events:violation` | exam | `violation.flagged` | analytics |

**HTTP (sync, one call).** Quiz auto-generate calls Question Bank
`POST /internal/questions/select` (guarded by the shared `INTERNAL_KEY` header) to pick
random questions. Nothing else makes synchronous cross-service calls; a live exam makes
none.

Every service keeps **read-model projections** of the data it reads but does not own (e.g.
exam keeps a `quizzes` + `subjects` projection fed by events), so it never queries another
service's database.

---

## 3. Databases

One database per service (five total; the scheduler has none and reads the quiz database):

```
auth-service-db          teachers, revoked_tokens, teacher_subjects
questionbank-service-db  subjects, units, questions
quiz-service-db          quizzes, quiz_questions, quiz_inline_questions
exam-service-db          student_sessions, student_answers, violation_flags, quiz_snapshot,
                         + quizzes/subjects projections
analytics-service-db     quizzes/subjects/student_sessions/violation_flags read-models
```

Use any PostgreSQL (local databases, separate Neon projects, etc.). In production use the
**pooled** connection string. Each service creates its own tables on first boot.

---

## 4. Prerequisites

- **Docker + Docker Compose** (recommended path), or **Node.js 20+** for running services
  directly.
- **PostgreSQL** — five databases reachable from the services.
- A way to generate a bcrypt hash for the admin password (a Node one-liner is shown below).

---

## 5. Run locally with Docker Compose

### Step 1 — Create the five databases

Create empty databases (local or managed) and keep each connection string:

```bash
createdb auth_db
createdb questionbank_db
createdb quiz_db
createdb exam_db
createdb analytics_db
```

### Step 2 — Generate the admin password hash

The admin login is env-based (no DB row). Generate a bcrypt hash:

```bash
cd services/auth && npm install bcryptjs >/dev/null 2>&1
node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword', 12))"
cd ../..
```

### Step 3 — Create each service's `.env`

Copy the example in each service folder and fill it in:

```bash
for s in auth questionbank quiz exam analytics scheduler; do
  cp services/$s/.env.example services/$s/.env
done
```

Then edit each `services/<svc>/.env`:

- `DATABASE_URL` — that service's own database (auth → auth_db, etc.; scheduler → quiz_db).
- `JWT_SECRET` — **the same long random value in every file** (all services verify the
  same tokens). Generate one with `openssl rand -hex 32`.
- `INTERNAL_KEY` — **the same value in auth, questionbank, and quiz**.
- `services/auth/.env` — also set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (from Step 2),
  `ADMIN_NAME`.

(Compose injects `REDIS_URL` and the internal service URLs automatically, so those lines in
the `.env` files are only needed when running without Docker.)

### Step 4 — Bring the backend up

```bash
docker compose up --build
```

This starts redis, the gateway, all six services, and the exam worker. Each runs its
migrations on boot. The gateway is API-only on `http://localhost:8080`.

### Step 5 — Run the client and open it

The SPA runs on the Vite dev server, which proxies `/api` to the gateway so the session
cookie stays same-origin (`VITE_API_URL` stays empty):

```bash
npm install --prefix client
npm run dev --prefix client      # Vite on http://localhost:5173
```

Open **http://localhost:5173** and log in with the `ADMIN_EMAIL` / password from Step 2.
(The services allow `localhost:5173` for CORS by default.)

The SPA shows a branded loading screen until **every** backend reports ready
(`GET /api/<svc>/ready`), so keep all services up. After changing migrations or event
schemas, `npm run reset` rebuilds the stack and flushes Redis (so streams/consumer groups
re-bootstrap); add `--no-build` to skip the rebuild.

Stop the backend with `docker compose down` (add `-v` to also drop the Redis volume).

---

## 6. Run in production

Deployment shape: the **backend** runs as the Docker Compose stack on an Ubuntu EC2 host;
**Caddy** terminates HTTPS in front of the gateway; the **frontend** is hosted on Vercel and
rewrites `/api/*` to the Caddy domain (same-origin, so the `SameSite=Lax` cookie works). The
gateway is API-only (404 on non-`/api`), so it never serves the SPA.

### Step 1 — EC2 host + Docker

Launch an Ubuntu EC2 instance. In the security group, open **inbound** only:

```
22    SSH     your IP only
80    HTTP    0.0.0.0/0
443   HTTPS   0.0.0.0/0
```

Never expose Postgres (5432) or Redis (6379) publicly. SSH in, install Docker + the Compose
plugin:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

sudo apt update
sudo apt install -y git curl ca-certificates docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

### Step 2 — Clone the project

```bash
git clone https://github.com/prawesh-12/quiz-platform.git
cd quiz-platform
```

### Step 3 — Create the service `.env` files

```bash
for s in auth questionbank quiz exam analytics scheduler; do
  cp services/$s/.env.example services/$s/.env
done
```

Generate the shared secrets and the admin password hash:

```bash
openssl rand -hex 32          # JWT_SECRET   (same value in every service)
openssl rand -hex 32          # INTERNAL_KEY (same value in auth/questionbank/quiz)

docker run --rm node:20-alpine sh -lc \
  'npm i bcryptjs >/dev/null 2>&1 && node -e "console.log(require(\"bcryptjs\").hashSync(\"YourStrongPassword\", 12))"'
```

Fill **every** `services/<svc>/.env`:

```
NODE_ENV=production
DATABASE_URL=pooled_postgres_url_for_that_service   # scheduler uses the quiz DB URL
JWT_SECRET=same_value_in_all_services
CLIENT_URLS=https://your-vercel-domain.vercel.app
```

Also in `services/auth/.env`:

```
ADMIN_EMAIL=...
ADMIN_PASSWORD_HASH=...     # the hash from above
ADMIN_NAME=...
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

And in `services/auth/.env`, `services/questionbank/.env`, `services/quiz/.env`:

```
INTERNAL_KEY=same_value
```

(`NODE_ENV=production` is required — it enables the HTTPS cookie and makes the
`RATE_LIMIT_DISABLED` kill switch a no-op. Use each provider's **pooled** `DATABASE_URL`;
exam is the busiest.)

### Step 4 — Start the backend

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f gateway
```

Each service runs its migrations on boot. Verify every service is ready through the gateway
(on the host):

```bash
for s in auth questionbank quiz analytics exam; do
  curl -s http://localhost:8080/api/$s/ready; echo
done
```

### Step 5 — HTTPS reverse proxy (Caddy)

The gateway is published on the host as `localhost:8080` (plain). Caddy terminates HTTPS in
front of it and auto-provisions a Let's Encrypt certificate.

Point DNS at the host first:

```
api.your-domain.com   A   <EC2 public IP>
```

Install Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Set `/etc/caddy/Caddyfile`:

```
api.your-domain.com {
  reverse_proxy localhost:8080
}
```

Reload and test:

```bash
sudo systemctl reload caddy
curl https://api.your-domain.com/api/auth/ready   # -> ready
```

Caddy listens on 80/443; the gateway stays private on `localhost:8080`. The nginx gateway
forwards `X-Forwarded-For`, so services see the real client IP through one proxy hop.

### Step 6 — Deploy the frontend (Vercel)

In [client/vercel.json](client/vercel.json), set the rewrite to the Caddy domain:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.your-domain.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

On Vercel:

```
Root directory:    client
Build command:     npm run build
Output directory:  dist
```

Leave `VITE_API_URL` empty (the client uses the same-origin `/api` rewrite). Then put the
Vercel domain in `CLIENT_URLS` in every backend `.env` and recreate the stack:

```bash
docker compose up -d --force-recreate
```

> If the frontend can't be same-origin with the API, instead set `VITE_API_URL` to the Caddy
> URL and switch the cookie to `COOKIE_SAMESITE=none` (cross-site cookies require `Secure`
> + `None`).

### Step 7 — Verify

Open the Vercel app and walk the end-to-end flow (§7 below): admin login, hard refresh on
`/admin`, subjects load, create teacher, teacher login, create subject/questions, start a
quiz, student submits, dashboard analytics update.

### Production hardening

- **Redis is a hard dependency** (event bus, not just a cache). Run managed/HA Redis with
  persistence; the bundled [docker/redis/redis.conf](docker/redis/redis.conf) enables AOF and
  uses `volatile-lru` so streams are never evicted.
- **Uploads**: the gateway allows up to 3 MB request bodies for avatar uploads.
- **Scaling**: scale the HTTP services (especially exam) horizontally; keep exactly **one**
  exam worker and **one** scheduler — duplicate signals are idempotent, but more than one is
  unnecessary.
- **Backups**: enable automated backups/PITR on each database before storing real data.
- **Logs**: every service logs structured JSON with the gateway-issued `X-Request-ID`, so a
  request can be traced across services.

---

## 7. Verify

Each service answers health checks directly; through the gateway:

```bash
curl http://localhost:8080/api/health     # gateway -> exam (default) -> {"status":"ok"}
```

Then exercise the flow end to end:

- Admin logs in, creates a teacher (auth).
- Teacher creates a subject + questions (questionbank), builds a quiz (quiz).
- Quiz activates (scheduler → quiz → snapshot event → exam).
- A student enters and submits (exam); the teacher sees live-stats and the dashboard
  populates (analytics).

---

## 8. Service reference

| Service | Consumes | Emits | Key routes |
| --- | --- | --- | --- |
| **auth** | — | `events:auth` | `/api/auth/*`, `/api/admin/teachers*`, `/api/admin/schools/*`, teacher avatars |
| **questionbank** | `events:auth` | `events:questionbank` | `/api/subjects/*`, `/api/units/*`, `/api/questions/*`, `/api/admin/subjects*`, `POST /internal/questions/select` |
| **quiz** | `events:scheduler`, `events:questionbank`, `events:auth` | `events:quiz` | `/api/quizzes/*` (CRUD), `/api/subjects/:id/quiz-history` |
| **exam** | `events:quiz`, `events:questionbank` | `events:session`, `events:violation` | `/api/sessions/*`, `/api/violations/*`, `/api/quizzes/:id/{live-stats,leaderboard,export,responses}` |
| **analytics** | `events:quiz`, `events:questionbank`, `events:session`, `events:violation` | — | `/api/admin/dashboard/*`, `/api/teachers/dashboard/*` |
| **scheduler** | (reads quiz db) | `events:scheduler` | none (timer only) |

---

## 9. Gateway routing

Nginx ([gateway/nginx.conf](gateway/nginx.conf)) matches most-specific first:

```
/api/teachers/me/avatar, /api/teachers/:id/avatar     -> auth
/api/subjects/:id/quiz-history                         -> quiz
/api/quizzes/:id/(live-stats|leaderboard|export|responses) -> exam
/api/admin/dashboard/, /api/teachers/dashboard/        -> analytics
/api/auth/, /api/admin/teachers, /api/admin/schools/   -> auth
/api/admin/subjects, /api/subjects/, /api/units/, /api/questions/ -> questionbank
/api/quizzes/                                          -> quiz
/api/sessions/, /api/violations/, /api/ (default)      -> exam
/api/<svc>/ready                                       -> that service's /api/ready
/ (everything else)                                    -> 404 (API-only; SPA served by Vercel/Vite)
```

---

The design decisions behind this split are recorded in [docs/adr/](docs/adr/).

---

## 10. Troubleshooting

- **A service exits at boot** — it failed env validation; check that `DATABASE_URL` and
  `JWT_SECRET` are set in that service's `.env`.
- **`/api/...` returns 401 everywhere** — `JWT_SECRET` differs between services; it must be
  identical.
- **Auto-generate fails with 403/401** — `INTERNAL_KEY` differs between quiz and
  questionbank.
- **Dashboards are empty** — analytics read-models build from new events only; they fill as
  quizzes are taken (an already-running system needs a one-time history replay).
- **Students can't get questions on a freshly activated quiz** — the `quiz.snapshot` event
  hasn't been consumed yet; confirm Redis is up and the exam worker is running.
- **Scheduled quizzes don't transition** — confirm Redis is up, the scheduler points at the
  quiz database, and the quiz service is consuming `events:scheduler`.
