# Running QuizLoom on your own machine

From a fresh copy of the code to a quiz you can take yourself. Do the steps in order.

If something goes wrong, skip to [When it does not work](#when-it-does-not-work).

## What you end up with

| Piece | Runs in | Address |
|---|---|---|
| The website | Vite, on your machine | http://localhost:5173 |
| The gateway | Docker | http://localhost:8080 |
| auth, questionbank, quiz, exam, analytics | Docker | reachable only through the gateway |
| exam-worker, scheduler | Docker | no address, they work in the background |
| Redis | Docker | localhost:6379 |
| Five databases | PostgreSQL, wherever you put them | your connection strings |

You use the site on port 5173. Anything the page asks for that starts with `/api` gets passed along to port 8080. This matters: the browser only ever talks to one address, so the login cookie works without extra setup.

---

## Step 1: install the tools

| Tool | Version | Check it with |
|---|---|---|
| Docker, with Compose | any current version | `docker compose version` |
| Node | 20 | `node -v` |
| git | any | `git --version` |

Start Docker before you go on. On Linux, make sure `docker` works without `sudo`, or you will need `sudo` on every command below.

## Step 2: get the code

```bash
git clone https://github.com/prawesh-12/quiz-platform.git
cd quiz-platform
```

## Step 3: create five databases

Each service keeps its own data and never touches another service's tables, so you need five:

| Database | Used by |
|---|---|
| `auth_db` | auth |
| `questionbank_db` | questionbank |
| `quiz_db` | quiz **and** scheduler |
| `exam_db` | exam and exam-worker |
| `analytics_db` | analytics |

Two services share `quiz_db` on purpose. The scheduler only reads from it.

**The easy way:** a free [Neon](https://neon.tech) project with five databases in it. You get five connection strings that look like this:

```
postgresql://user:password@ep-something-pooler.region.aws.neon.tech/auth_db?sslmode=require
```

**On your own machine:** PostgreSQL works too, with one catch. The services run inside Docker, so `localhost` in a connection string means the container itself, not your machine. Write `host.docker.internal` instead of `localhost`, and on Linux add these two lines to every service in `docker-compose.dev.yml`:

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

You never create tables by hand. Each service builds its own the first time it starts.

## Step 4: write the settings files

Each service reads its settings from a file called `.env.local`. These files are not in git, so you make them yourself:

```bash
for s in auth questionbank quiz exam analytics scheduler; do
  cp services/$s/.env.example services/$s/.env.local
done
```

Now fill in all six. Most values belong to one service, but four have to match across files:

| Value | Goes in | What happens if they do not match |
|---|---|---|
| `JWT_SECRET` | all five services with logins | You log in fine, then everything else says "not allowed" |
| `INTERNAL_KEY` | quiz and questionbank | Building a quiz from the question bank fails |
| `CLIENT_URLS` | all five | The browser refuses to talk to the backend |
| `DATABASE_URL` | one per service, not shared | A service reads or writes the wrong data |

For local work, put `CLIENT_URLS=http://localhost:5173` in all five.

Here is `services/auth/.env.local`, filled in as an example:

```bash
DATABASE_URL=postgresql://user:pass@host/auth_db?sslmode=require
JWT_SECRET=some-long-random-string
JWT_EXPIRES_IN=8h
INTERNAL_KEY=another-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=            # step 5 fills this in
ADMIN_NAME=Admin
REDIS_URL=redis://localhost:6379
CLIENT_URLS=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

Two things about that file:

- **Leave `COOKIE_SECURE` as false.** A secure cookie is only sent over HTTPS, and your local site is plain HTTP. Set it to true and you will log in, get nothing back, and end up on the login page again.
- **`REDIS_URL` is ignored** while you run through Docker. Docker sets its own value. The line only matters if you start a service directly with `node`.

The other five files are shorter. The scheduler needs two values, and its `DATABASE_URL` is the same one you gave the quiz service.

## Step 5: make an admin password

The admin account is not stored in a database. The auth service compares what you type against a scrambled version of the password kept in its settings file, so you make that scrambled version yourself.

Install the auth service first, then scramble a password of your choosing:

```bash
npm install --prefix services/auth
cd services/auth
node -e "console.log(require('bcryptjs').hashSync('your-password-here', 10))"
cd ../..
```

Copy the output, which starts with `$2a$` or `$2b$`, into `ADMIN_PASSWORD_HASH` in `services/auth/.env.local`. Remember the plain password. That is what you type on the login screen.

## Step 6: install everything

```bash
npm install
npm run setup
```

The first command sets up the code checker. The second installs the six services and the website, which takes a few minutes the first time.

## Step 7: start it

```bash
npm run dev
```

This starts everything in Docker, then starts the website. The first run builds nine Docker images, so give it a few minutes. After that it takes seconds.

Wait for this line:

```
  ➜  Local:   http://localhost:5173/
```

In another terminal, check the backend answers:

```bash
curl http://localhost:8080/api/health
```

You want a 200 back. If nothing answers, the containers are still starting. Wait a moment and try again.

## Step 8: run a quiz end to end

1. Open http://localhost:5173.
2. Sign in on the **Admin** tab, with `ADMIN_EMAIL` and the password from step 5.
3. Add a school, then a teacher. The teacher's password is shown on screen.
4. Sign out, then sign in on the **Teacher** tab as that teacher.
5. Add a subject, a unit, and a few questions. Or upload an Excel file of questions.
6. Make a quiz. Set the start time a minute or two ahead, and the end time a few minutes after that.
7. Copy the share link, open it in a private window, type the access code, and answer a few questions. Watch the teacher's monitoring screen fill in.
8. Wait for the end time. The quiz closes by itself and everyone gets a score, whether or not they pressed Submit.

If step 8 works, everything works: the scheduler noticed the time, Redis passed the message along, the quiz service closed the quiz, and the background worker did the marking.

---

## Commands you will use

| Command | What it does |
|---|---|
| `npm run dev` | Start everything |
| `npm run down` | Stop the containers |
| `npm run reset` | Rebuild, restart, and clear Redis |
| `npm run lint` | Check the code for mistakes |
| `npm run build` | Build the website, to check it still builds |
| `npm test` | Run the tests, needs everything running |

To watch what a service is doing:

```bash
docker compose logs -f quiz
docker compose logs -f exam-worker
```

## When to reset

`npm run reset` stops everything, rebuilds it, starts it again, and clears Redis. Use it after:

- changing anything about the database tables
- changing what a message between services contains
- anything that looks stuck on old data

Clearing Redis throws away messages that were never delivered. That is fine on your machine and never acceptable on the real server.

Two shortcuts: `scripts/reset.sh --no-build` skips the rebuild, and `--hard` also clears Docker's leftover build files.

## Running the tests

The tests need a running site, so start everything first:

```bash
export GATEWAY_URL=http://localhost:8080
export TEST_ADMIN_EMAIL=admin@example.com
export TEST_ADMIN_PASSWORD=your-password-here
npm test
```

Tests skip themselves when these values are missing, so read the output. A green result does not always mean they ran.

---

## When it does not work

**A service starts and immediately stops.** A setting is missing. Each service checks its settings first and refuses to start, naming what it needs. Read the message:

```bash
docker compose logs auth | tail -20
```

**You log in, then everything says you are not allowed.** `JWT_SECRET` is different in one of the files. Make all five identical and restart.

**The browser blocks requests to the backend.** `CLIENT_URLS` is missing `http://localhost:5173`. Add it in all five files.

**You log in and land back on the login page.** Either `COOKIE_SECURE` is true, or you opened port 8080 instead of 5173. Use 5173. Port 8080 does not serve the website.

**Building a quiz from the question bank fails.** `INTERNAL_KEY` is different in quiz and questionbank.

**A service cannot reach its database.** If PostgreSQL is on your own machine, the container cannot see it as `localhost`. See step 3.

**Quizzes never start or end on time.** The scheduler or Redis is down:

```bash
docker compose ps
docker compose logs scheduler
```

**Something is stale and you cannot explain it.** `npm run reset`.

More problems and causes: [Troubleshooting](./14_troubleshooting.md).

## Related documentation

- [Architecture](./1_architecture.md) — what the services are and how they talk
- [Deploying to production](./prod_deploy.md)
- [Deployment reference](./12_deployment.md) — every setting, in one table
- [Testing](./13_testing.md)
