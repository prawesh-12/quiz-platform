# QuizLoom Documentation

Engineering documentation for QuizLoom as it exists today. The code is the source of truth; these documents describe what it does and why.

QuizLoom is a quiz platform for a college. Teachers build quizzes from a question bank, students take them through a share link with no account, and teachers watch results live. The backend is six microservices behind one nginx gateway, five of them with their own PostgreSQL database, talking over Redis Streams. The frontend is a React SPA hosted on Vercel.

Start with [Architecture](./1_architecture.md).

## Documentation

| # | Area | Document | What it covers |
|---|---|---|---|
| 1 | Architecture | [1_architecture.md](./1_architecture.md) | The services, how they talk, repository layout, the shape every service shares |
| 2 | API Gateway | [2_api_gateway.md](./2_api_gateway.md) | nginx routing, readiness paths, header handling |
| 3 | Authentication | [3_authentication.md](./3_authentication.md) | Staff JWT cookies, revocation, roles, student session tokens, rate limits, security controls |
| 4 | Question Bank | [4_question_bank.md](./4_question_bank.md) | Subjects, units, questions, subject access, the internal selection endpoint |
| 5 | Quiz | [5_quiz.md](./5_quiz.md) | Quiz authoring, the status state machine, scheduling, snapshots |
| 6 | Exam | [6_exam.md](./6_exam.md) | Student sessions, answers, scoring, auto-submit, proctoring, teacher monitoring |
| 7 | Scheduler | [7_scheduler.md](./7_scheduler.md) | Due detection, dedup, why it emits signals instead of doing the work |
| 8 | Analytics | [8_analytics.md](./8_analytics.md) | Event-fed read-models and the dashboard queries |
| 9 | Events | [9_events.md](./9_events.md) | The transactional outbox, Redis Streams, retries and dead letters, the event catalog |
| 10 | Databases | [10_databases.md](./10_databases.md) | Per-service databases, ownership, read-models, migrations, pooling |
| 11 | Frontend | [11_frontend.md](./11_frontend.md) | SPA structure, routing, warmup, auth hydration, the student quiz runner |
| 12 | Deployment | [12_deployment.md](./12_deployment.md) | Compose stack, CI/CD, rollback, environment configuration |
| 13 | Testing | [13_testing.md](./13_testing.md) | The integration suite, CI checks, and the gaps |
| 14 | Troubleshooting | [14_troubleshooting.md](./14_troubleshooting.md) | Symptoms with their real causes, and the project glossary |

## Guides

Step-by-step, start to finish. The table above is reference; these two are instructions.

| Guide | What it covers |
|---|---|
| [Running on your own machine](./local_deploy.md) | Fresh clone to a quiz you can take yourself |
| [Putting it on a real server](./prod_deploy.md) | Empty server to a site that updates itself on push |

## Reading order

If you are new to the codebase, read 1, then 9 (the event model explains most of the odd-looking table duplication), then whichever service you are about to change.

If you are debugging a live quiz, read 5, 6 and 7 together. They describe one lifecycle split across three services.

## Where things are decided

| Question | Document |
|---|---|
| Which service owns this table? | [Databases](./10_databases.md) |
| Which service handles this URL? | [API gateway](./2_api_gateway.md) |
| Who publishes this event, and who reads it? | [Events](./9_events.md) |
| What happens when a quiz ends? | [Quiz](./5_quiz.md), then [Exam](./6_exam.md) |
| Why is a teacher seeing 404 on their own quiz? | [Troubleshooting](./14_troubleshooting.md) |
