<div align="center">

<h1>
  <img src="./client/public/icon-512.png" width="38" alt="" valign="middle" />
  QuizLoom
</h1>

A platform for conducting scheduled online examinations, from quiz creation and student access to live monitoring and automatic evaluation.

Built as an event-driven microservices system.

Teachers create a quiz, define its schedule, and share a single access link. Students join without creating an account, complete the exam, and have their answers saved while they work.

**Every student is graded when the quiz closes, whether or not they pressed Submit.**

![QuizLoom](./public/quizloom_landing_page.png)

</div>

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
  - [One quiz, start to finish](#one-quiz-start-to-finish)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [What problem it solves](#what-problem-it-solves)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Documentation](#documentation)
- [Testing](#testing)
- [Production deployment](#production-deployment)
- [Design decisions](#design-decisions)
- [Future improvements](#future-improvements)
- [License](#license)

---

## Features

| Feature                | What it does                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| Question bank          | Subjects, units, and reusable questions per unit                             |
| Excel import           | Upload a spreadsheet of questions into a subject                             |
| Auto-generated quizzes | Pick N random bank questions per unit                                        |
| Scheduled quizzes      | Set a start and end time; the quiz opens and closes on its own               |
| Student entry          | A link and an access code. No account                                        |
| Autosave               | Answers are saved while the student works                                    |
| Auto-submit            | When the quiz ends, open sessions are scored from saved answers              |
| Proctoring flags       | Tab switches, copy attempts, and right clicks are recorded per session       |
| Live monitoring        | Who has entered, submitted, is still working, or is flagged                  |
| Results                | Leaderboard, per-student responses, and an XLSX export sorted by roll number |
| Dashboards             | Quiz counts, participants, and average scores for teachers and admins        |

---

## Architecture

Six microservices behind an nginx gateway. Five own a PostgreSQL database; the scheduler owns none and reads the quiz database. The SPA is on Vercel and is deployed separately.

| Component    | Runs as                       | Owns                                                |
| ------------ | ----------------------------- | --------------------------------------------------- |
| gateway      | nginx container, port 8080    | Routes`/api/*`, strips inbound `X-Internal-Key` |
| auth         | container                     | Teachers, sessions, avatars                         |
| questionbank | container                     | Subjects, units, questions                          |
| quiz         | container                     | Quizzes, their questions, the status lifecycle      |
| exam         | container                     | Student sessions, answers, violations               |
| exam-worker  | same image,`node worker.js` | Event consumers, auto-submit                        |
| scheduler    | container, no HTTP            | Nothing. Reads the quiz database                    |
| analytics    | container                     | Dashboard read-models, rebuilt from events          |
| redis        | container                     | Event streams, snapshot cache, token denylist       |
| client       | Vercel                        | The SPA                                             |

![QuizLoom architecture](./public/quizloom_hld_dark.png)

Services publish events to Redis Streams instead of calling each other. Each writes the event into an outbox table in the same transaction as the data change, and a relay pushes it to Redis. There is one synchronous call in the whole system: quiz asks questionbank for bank questions during auto-generate.

Nothing reads another service's tables. Where a service needs data it does not own, it keeps a local copy filled from events. Details in [docs/9_events.md](./docs/9_events.md).

### One quiz, start to finish

![One quiz, start to finish](./public/quizloom_quiz_lifecycle_dark.png)

---

## Screenshots

|  |  |
| --- | --- |
| ![Sign in](./public/quizloom_auth_page.png) | ![Teacher dashboard](./public/quizloom_Teacher_dashboard_page.png) |
| One sign-in page with Teacher and Admin tabs. | Teacher dashboard: counts, participant trend, recent quizzes. |
| ![Admin dashboard](./public/quizloom_Admin_dashboard_page.png) | ![Quiz responses](./public/quizloom_quiz_response_page.png) |
| Admin dashboard, scoped by school tab. | One quiz's responses: score, submit time, proctoring flags, XLSX export. |

---

## Tech stack

| Layer | |
| --- | --- |
| **Frontend** | ![React 18](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=reactrouter&logoColor=white) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=reactquery&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat&logo=radixui&logoColor=white) ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white) |
| **Backend** | ![Node.js 20](https://img.shields.io/badge/Node.js_20-5FA04E?style=flat&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white) |
| **Databases** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white) ![Neon](https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon&logoColor=black) ![node-postgres](https://img.shields.io/badge/node--postgres-336791?style=flat&logo=npm&logoColor=white) |
| **Events and cache** | ![Redis Streams](https://img.shields.io/badge/Redis_Streams-FF4438?style=flat&logo=redis&logoColor=white) ![ioredis](https://img.shields.io/badge/ioredis-D82C20?style=flat&logo=npm&logoColor=white) |
| **Auth** | ![JWT HS256](https://img.shields.io/badge/JWT_HS256-000000?style=flat&logo=jsonwebtokens&logoColor=white) ![bcrypt](https://img.shields.io/badge/bcrypt-8B5E3C?style=flat&logo=npm&logoColor=white) |
| **Gateway** | ![nginx](https://img.shields.io/badge/nginx-009639?style=flat&logo=nginx&logoColor=white) |
| **Files** | ![ExcelJS](https://img.shields.io/badge/ExcelJS-217346?style=flat&logo=npm&logoColor=white) ![Multer](https://img.shields.io/badge/Multer-FF6C37?style=flat&logo=npm&logoColor=white) ![SheetJS](https://img.shields.io/badge/SheetJS-1D6F42?style=flat) |
| **Infrastructure** | ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat&logo=docker&logoColor=white) ![AWS Lightsail](https://img.shields.io/badge/AWS_Lightsail-FF9900?style=flat&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZD0iTTYuNzYzIDEwLjAzNmMwIC4yOTYuMDMyLjUzNS4wODguNzEuMDY0LjE3Ni4xNDQuMzY4LjI1Ni41NzYuMDQuMDYzLjA1Ni4xMjcuMDU2LjE4MyAwIC4wOC0uMDQ4LjE2LS4xNTIuMjRsLS41MDMuMzM1YS4zODMuMzgzIDAgMCAxLS4yMDguMDcyYy0uMDggMC0uMTYtLjA0LS4yMzktLjExMmEyLjQ3IDIuNDcgMCAwIDEtLjI4Ny0uMzc1IDYuMTggNi4xOCAwIDAgMS0uMjQ4LS40NzFjLS42MjIuNzM0LTEuNDA1IDEuMTAxLTIuMzQ3IDEuMTAxLS42NyAwLTEuMjA1LS4xOTEtMS41OTYtLjU3NC0uMzkxLS4zODQtLjU5LS44OTQtLjU5LTEuNTMzIDAtLjY3OC4yMzktMS4yMy43MjYtMS42NDQuNDg3LS40MTUgMS4xMzMtLjYyMyAxLjk1NS0uNjIzLjI3MiAwIC41NTEuMDI0Ljg0Ni4wNjQuMjk2LjA0LjYuMTA0LjkxOC4xNzZ2LS41ODNjMC0uNjA3LS4xMjctMS4wMy0uMzc1LTEuMjc3LS4yNTUtLjI0OC0uNjg2LS4zNjctMS4zLS4zNjctLjI4IDAtLjU2OC4wMzEtLjg2My4xMDMtLjI5NS4wNzItLjU4My4xNi0uODYyLjI3MmEyLjI4NyAyLjI4NyAwIDAgMS0uMjguMTA0LjQ4OC40ODggMCAwIDEtLjEyNy4wMjNjLS4xMTIgMC0uMTY4LS4wOC0uMTY4LS4yNDd2LS4zOTFjMC0uMTI4LjAxNi0uMjI0LjA1Ni0uMjhhLjU5Ny41OTcgMCAwIDEgLjIyNC0uMTY3Yy4yNzktLjE0NC42MTQtLjI2NCAxLjAwNS0uMzZhNC44NCA0Ljg0IDAgMCAxIDEuMjQ2LS4xNTFjLjk1IDAgMS42NDQuMjE2IDIuMDkxLjY0Ny40MzkuNDMuNjYyIDEuMDg1LjY2MiAxLjk2M3YyLjU4NnptLTMuMjQgMS4yMTRjLjI2MyAwIC41MzQtLjA0OC44MjItLjE0NC4yODctLjA5Ni41NDMtLjI3MS43NTgtLjUxLjEyOC0uMTUyLjIyNC0uMzIuMjcyLS41MTIuMDQ3LS4xOTEuMDgtLjQyMy4wOC0uNjk0di0uMzM1YTYuNjYgNi42NiAwIDAgMC0uNzM1LS4xMzYgNi4wMiA2LjAyIDAgMCAwLS43NS0uMDQ4Yy0uNTM1IDAtLjkyNi4xMDQtMS4xOS4zMi0uMjYzLjIxNS0uMzkuNTE4LS4zOS45MTcgMCAuMzc1LjA5NS42NTUuMjk1Ljg0Ni4xOTEuMi40Ny4yOTYuODM4LjI5NnptNi40MS44NjJjLS4xNDQgMC0uMjQtLjAyNC0uMzA0LS4wOC0uMDY0LS4wNDgtLjEyLS4xNi0uMTY4LS4zMTFMNy41ODYgNS41NWExLjM5OCAxLjM5OCAwIDAgMS0uMDcyLS4zMmMwLS4xMjguMDY0LS4yLjE5MS0uMmguNzgzYy4xNTEgMCAuMjU1LjAyNS4zMS4wOC4wNjUuMDQ4LjExMy4xNi4xNi4zMTJsMS4zNDIgNS4yODQgMS4yNDUtNS4yODRjLjA0LS4xNi4wODgtLjI2NC4xNTEtLjMxMmEuNTQ5LjU0OSAwIDAgMSAuMzItLjA4aC42MzhjLjE1MiAwIC4yNTYuMDI1LjMyLjA4LjA2My4wNDguMTIuMTYuMTUxLjMxMmwxLjI2MSA1LjM0OCAxLjM4MS01LjM0OGMuMDQ4LS4xNi4xMDQtLjI2NC4xNi0uMzEyYS41Mi41MiAwIDAgMSAuMzExLS4wOGguNzQzYy4xMjcgMCAuMi4wNjUuMi4yIDAgLjA0LS4wMDkuMDgtLjAxNy4xMjhhMS4xMzcgMS4xMzcgMCAwIDEtLjA1Ni4ybC0xLjkyMyA2LjE3Yy0uMDQ4LjE2LS4xMDQuMjYzLS4xNjguMzExYS41MS41MSAwIDAgMS0uMzAzLjA4aC0uNjg3Yy0uMTUxIDAtLjI1NS0uMDI0LS4zMi0uMDgtLjA2My0uMDU2LS4xMTktLjE2LS4xNS0uMzJsLTEuMjM4LTUuMTQ4LTEuMjMgNS4xNGMtLjA0LjE2LS4wODcuMjY0LS4xNS4zMi0uMDY1LjA1Ni0uMTc3LjA4LS4zMi4wOHptMTAuMjU2LjIxNWMtLjQxNSAwLS44My0uMDQ4LTEuMjI5LS4xNDMtLjM5OS0uMDk2LS43MS0uMi0uOTE4LS4zMi0uMTI4LS4wNzEtLjIxNS0uMTUxLS4yNDctLjIyM2EuNTYzLjU2MyAwIDAgMS0uMDQ4LS4yMjR2LS40MDdjMC0uMTY3LjA2NC0uMjQ3LjE4My0uMjQ3LjA0OCAwIC4wOTYuMDA4LjE0NC4wMjQuMDQ4LjAxNi4xMi4wNDguMi4wOC4yNzEuMTIuNTY2LjIxNS44NzguMjc5LjMxOS4wNjQuNjMuMDk2Ljk1LjA5Ni41MDIgMCAuODk0LS4wODggMS4xNjUtLjI2NGEuODYuODYgMCAwIDAgLjQxNS0uNzU4Ljc3Ny43NzcgMCAwIDAtLjIxNS0uNTU5Yy0uMTQ0LS4xNTEtLjQxNi0uMjg3LS44MDctLjQxNWwtMS4xNTctLjM2Yy0uNTgzLS4xODMtMS4wMTQtLjQ1NC0xLjI3Ny0uODEzYTEuOTAyIDEuOTAyIDAgMCAxLS40LTEuMTU4YzAtLjMzNS4wNzMtLjYzLjIxNi0uODg2LjE0NC0uMjU1LjMzNS0uNDc5LjU3NS0uNjU0LjI0LS4xODQuNTEtLjMyLjgzLS40MTUuMzItLjA5Ni42NTUtLjEzNiAxLjAwNi0uMTM2LjE3NSAwIC4zNTkuMDA4LjUzNS4wMzIuMTgzLjAyNC4zNS4wNTYuNTE4LjA4OC4xNi4wNC4zMTIuMDguNDU1LjEyNy4xNDQuMDQ4LjI1Ni4wOTYuMzM2LjE0NGEuNjkuNjkgMCAwIDEgLjI0LjIuNDMuNDMgMCAwIDEgLjA3MS4yNjN2LjM3NWMwIC4xNjgtLjA2NC4yNTYtLjE4NC4yNTZhLjgzLjgzIDAgMCAxLS4zMDMtLjA5NiAzLjY1MiAzLjY1MiAwIDAgMC0xLjUzMi0uMzExYy0uNDU1IDAtLjgxNS4wNzEtMS4wNjIuMjIzLS4yNDguMTUyLS4zNzUuMzgzLS4zNzUuNzEgMCAuMjI0LjA4LjQxNi4yNC41NjcuMTU5LjE1Mi40NTQuMzA0Ljg3Ny40NGwxLjEzNC4zNThjLjU3NC4xODQuOTkuNDQgMS4yMzcuNzY3LjI0Ny4zMjcuMzY3LjcwMi4zNjcgMS4xMTcgMCAuMzQzLS4wNzIuNjU1LS4yMDcuOTI2LS4xNDQuMjcyLS4zMzYuNTExLS41ODMuNzAzLS4yNDguMi0uNTQzLjM0My0uODg2LjQ0Ny0uMzYuMTExLS43MzQuMTY3LTEuMTQyLjE2N3pNMjEuNjk4IDE2LjIwN2MtMi42MjYgMS45NC02LjQ0MiAyLjk2OS05LjcyMiAyLjk2OS00LjU5OCAwLTguNzQtMS43LTExLjg3LTQuNTI2LS4yNDctLjIyMy0uMDI0LS41MjcuMjcyLS4zNTEgMy4zODQgMS45NjMgNy41NTkgMy4xNTMgMTEuODc3IDMuMTUzIDIuOTE0IDAgNi4xMTQtLjYwNyA5LjA2LTEuODUyLjQzOS0uMi44MTQuMjg3LjM4My42MDd6TTIyLjc5MiAxNC45NjFjLS4zMzYtLjQzLTIuMjItLjIwNy0zLjA3NC0uMTAzLS4yNTUuMDMyLS4yOTUtLjE5Mi0uMDYzLS4zNiAxLjUtMS4wNTMgMy45NjctLjc1IDQuMjU0LS4zOTkuMjg3LjM2LS4wOCAyLjgyNi0xLjQ4NSA0LjAwNy0uMjE1LjE4NC0uNDIzLjA4OC0uMzI3LS4xNTEuMzItLjc5IDEuMDMtMi41Ny42OTUtMi45OTR6Ii8%2BPC9zdmc%2B&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white) |
| **Testing** | ![node:test](https://img.shields.io/badge/node:test-5FA04E?style=flat&logo=nodedotjs&logoColor=white) |

---

## What problem it solves

A lecturer runs a 15-minute MCQ test in a lab. Thirty students, all at once, on their own laptops.

Google Forms and Microsoft Forms have no question bank. Every test is typed out from scratch, and neither one imports questions from the Excel sheets lecturers already keep. Nothing carries over to the next division or the next semester.

The window is manual too. Someone pastes the link at 10:00 and closes the form by hand at 10:15, and anyone who did not press Submit has no response at all. Paper means grading thirty sheets by hand.

Here the questions live in a bank. Import a subject's questions from Excel once, split them into units, then pull a random set per unit into each quiz, so two divisions get different papers from the same source. Set the window, share one link, get a scored spreadsheet when it closes. Students never make an account.

---

## Project structure

```text
quiz-platform/
├── client/                 React SPA
├── gateway/nginx.conf      every route in the system, in one file
├── services/
│   ├── auth/               login, cookies, teachers, avatars, admin
│   ├── questionbank/       subjects, units, questions
│   ├── quiz/               authoring, status lifecycle, snapshots
│   ├── exam/               sessions, answers, violations, monitoring
│   │   └── worker.js       consumers and auto-submit
│   ├── analytics/          dashboard read-models
│   └── scheduler/          due detection
├── docker/redis/           Redis image and config
├── docker-compose.yml      production stack
├── docker-compose.dev.yml  local overlay
├── scripts/                deploy.sh and reset.sh
├── tests/integration/      run against a live gateway
└── docs/                   documentation, one file per area
```

Every service has the same layout inside `src/`: `config/`, `middleware/`, `routes/`, `controllers/`, `services/`, `repositories/`, `validators/`, `migrations/`, `utils/`.

---

## Getting started

Needs Docker, Node 20, and five PostgreSQL databases the services can reach.

```bash
git clone https://github.com/prawesh-12/quiz-platform.git
cd quiz-platform

for s in auth questionbank quiz exam analytics scheduler; do
  cp services/$s/.env.example services/$s/.env.local
done
# fill each one in

npm run setup
npm run dev
```

The gateway is on `http://localhost:8080` and the SPA on `http://localhost:5173`. Sign in with the admin credentials from `services/auth/.env.local`.

Migrations run on boot, so there is no separate migrate step. After changing a migration or an event payload, run `npm run reset` to rebuild and flush Redis.

Step-by-step version, including how to fill in the config: [docs/local_deploy.md](./docs/local_deploy.md). Troubleshooting: [docs/14_troubleshooting.md](./docs/14_troubleshooting.md).

---

## Environment variables

Each service has a `.env.example` listing every key it reads. Copy it to `.env.local` for development and `.env.production` for deployment; the one that loads is picked by `NODE_ENV`. Both real files are gitignored.

Required keys are checked at startup and the service refuses to boot without them.

Full reference, including the values that have to match across services: [docs/12_deployment.md](./docs/12_deployment.md).

---

## Documentation

**Everything starts at [docs/main_docs.md](./docs/main_docs.md).** It indexes all fourteen documents, says which one answers which question, and gives a reading order.

From there it splits by area: architecture, gateway, authentication, question bank, quiz, exam, scheduler, analytics, events, databases, frontend, deployment, testing, troubleshooting. API endpoints live in the area document that owns them.

Two step-by-step guides, if you would rather follow instructions than read reference:

| Guide | What it covers |
| --- | --- |
| [Running on your own machine](./docs/local_deploy.md) | Fresh clone to a quiz you can take yourself |
| [Putting it on a real server](./docs/prod_deploy.md) | Empty server to a site that updates itself on push |

New to the code: read [architecture](./docs/1_architecture.md), then [events](./docs/9_events.md).

---

## Testing

```bash
npm run test:unit           # 51 cases, nothing needs to be running

export GATEWAY_URL=http://localhost:8080
export TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=...
npm run test:integration    # 27 cases against a running stack
```

Unit tests cover scoring, quiz timing, the status machine and the cache. They need no database and run on every push and pull request. Integration tests go through the gateway against a live stack and mock nothing. They skip themselves when no gateway answers or a credential is missing, so read the output.

More, including CI: [docs/13_testing.md](./docs/13_testing.md).

---

## Production deployment

The backend runs as the same Docker Compose stack on AWS Lightsail. The frontend is on Vercel. Databases are Neon. Pushing to `main` deploys the backend.

```mermaid
flowchart LR
    P[push to main] --> GH[GitHub Actions]
    GH --> C[install, syntax check, build client]
    C --> TS[join the tailnet]
    TS --> V[ssh to the VPS, run deploy.sh]
    V --> H{healthy?}
    H -->|yes| D[done]
    H -->|no| RB[roll back to the previous commit, fail the job]
```

The VPS has no public SSH port. GitHub Actions reaches it over Tailscale. `scripts/deploy.sh` rebuilds the stack, polls the health endpoints, and rolls back to the previous commit if they never answer.

Full walkthrough from an empty server: [docs/prod_deploy.md](./docs/prod_deploy.md). Every setting in one table: [docs/12_deployment.md](./docs/12_deployment.md).

---

## Design decisions

**One database per service.** Five services sharing one schema turns every change into a coordination problem. Each service owns its own database and copies what it needs from other services through events. The cost is no joins across services and read-models that can lag, which is why a teacher can get a 404 on their own quiz if a projection is behind.

**Events go through an outbox.** Writing to Postgres and publishing to Redis are two systems with no shared transaction, so a crash between them loses the event. Events are written to `outbox_events` in the same transaction as the data change, and a relay publishes them. The cost is up to a second of delay.

**Auto-submit is driven by an event, not the browser.** Students close laptops and lose wifi, so anything depending on a final request from the browser loses those attempts. `quiz.ended` triggers the worker, which scores every open session from saved answers. The cost is that "ended" and "everyone scored" are a few seconds apart.

**Questions are copied into the quiz.** If a quiz pointed at bank rows, editing a question next term would change what last term's quiz shows. Every question is copied in at creation. The cost is duplicated content, and a typo fixed in the bank does not reach quizzes already built.

More, per area, in [`docs/`](./docs/main_docs.md).

---

## Future improvements

1. A test for the whole student journey: enter with a code, autosave, submit, auto-submit.
2. Make the event consumer's retry timings configurable, then finish the skipped consumer-retry tests.
3. Close the published Redis port.
4. Drop `plain_password` and add a password reset instead.
5. Consumer lag metric and a dead-letter alert.
6. Give the scheduler an endpoint on the quiz service instead of a direct database connection.

---

## License

MIT. See [LICENSE](./LICENSE).
