# Putting QuizLoom on a real server

From an empty server to a live site that updates itself every time you push. Read [Running on your own machine](./local_deploy.md) first if you have never started the stack at all.

There are three pieces, and each one gets there a different way:

| Piece | Lives on | Updated by |
|---|---|---|
| The backend, nine containers | one server | pushing to `main` |
| The website | Vercel | Vercel, watching the same repo |
| Five databases | Neon | you, once |

Steps 1 to 7 you do once. After that, deploying is `git push`.

---

## What you need first

- A server with at least 2 GB of memory. This runs on AWS Lightsail, but any Ubuntu machine works.
- A domain name pointing at that server.
- A [Neon](https://neon.tech) account for the databases.
- A [Vercel](https://vercel.com) account for the website.
- A [Tailscale](https://tailscale.com) account. This lets GitHub reach your server without leaving SSH open to the internet.

## Step 1: create the five databases

The same five as on your own machine, one per service:

`auth_db`, `questionbank_db`, `quiz_db`, `exam_db`, `analytics_db`

Use the connection string with **`-pooler`** in the address. Each service opens up to 20 connections at once, and six services on the plain address will run you out.

Keep the five strings somewhere safe. You need them in step 3.

No tables to create. Each service builds its own when it first starts.

## Step 2: set up the server

Log in and install Docker:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
```

Log out and back in so that last line takes effect, then check:

```bash
docker compose version
```

Now put the code in `/opt/quizloom`. That path matters, it is what the deploy expects:

```bash
sudo mkdir -p /opt/quizloom
sudo chown $USER:$USER /opt/quizloom
git clone https://github.com/prawesh-12/quiz-platform.git /opt/quizloom
cd /opt/quizloom
```

## Step 3: write the settings files

On the server, each service reads `.env.production` instead of `.env.local`. These files are not in git and live only on the server, which is why deploys can wipe and rebuild the code without touching your passwords.

Make all six:

```bash
cd /opt/quizloom
for s in auth questionbank quiz exam analytics scheduler; do
  cp services/$s/.env.example services/$s/.env.production
done
```

Fill them in. Four things differ from your own machine:

| Setting | On your machine | On the server |
|---|---|---|
| `COOKIE_SECURE` | false | **true** |
| `CLIENT_URLS` | http://localhost:5173 | your public site, like `https://quizloom.vercel.app` |
| `CLIENT_URL`, quiz only | http://localhost:5173 | the same public site |
| `DATABASE_URL` | test databases | the Neon strings from step 1 |

`CLIENT_URL` on the quiz service is what student links are built from. Get it wrong and every link you hand out points somewhere useless.

These two still have to match across files:

- `JWT_SECRET`, in all five services with logins. Make a new one for the server: `openssl rand -base64 48`
- `INTERNAL_KEY`, in quiz and questionbank. New one too.

Do not reuse the values from your own machine. Anyone who has seen them could log in as anyone.

The admin password works the same way as before:

```bash
npm install --prefix services/auth
cd services/auth
node -e "console.log(require('bcryptjs').hashSync('a-strong-password', 10))"
cd ../..
```

Put the output in `ADMIN_PASSWORD_HASH` in `services/auth/.env.production`.

Then stop other users on the server from reading these files:

```bash
chmod 600 services/*/.env.production
```

## Step 4: start it once, by hand

```bash
cd /opt/quizloom
docker compose up -d --build
```

This builds nine images, so the first run takes several minutes. When it settles:

```bash
docker compose ps
curl http://localhost:8080/api/health
```

Every container should say `Up`, and health should answer 200. Then check each service reached its database:

```bash
for p in auth questionbank quiz analytics exam; do
  echo -n "$p: "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/$p/ready
done
```

Five 200s. A 503 means that one service cannot reach its database, so check its `DATABASE_URL`.

If a container keeps restarting, find out why:

```bash
docker compose logs auth | tail -30
```

A missing setting is the usual answer. Services stop rather than run half set up.

## Step 5: put HTTPS in front

The stack serves plain HTTP on port 8080. Nothing in this repo deals with certificates, so you set that up on the server yourself.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Write `/etc/nginx/sites-available/quizloom` with a block for your domain that passes everything to `http://localhost:8080`, turn it on, then:

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot rewrites the config for HTTPS and renews the certificate on its own. Check it from your laptop:

```bash
curl https://your-domain.com/api/health
```

**Close the Redis port while you are here.** `docker-compose.yml` opens port 6379 on the server, so it is reachable from the internet unless you stop it. Either delete the two `ports:` lines under the redis service, or block it:

```bash
sudo ufw deny 6379
```

Nothing outside Docker needs that port.

## Step 6: put the website on Vercel

Vercel builds the website straight from the repo. It has nothing to do with the server deploy.

1. Import the repository in Vercel.
2. Set **Root Directory** to `client`.
3. Framework: Vite. Build command `npm run build`, output directory `dist`. Vercel usually fills both in.
4. Deploy.

Now point the website at your backend. `client/vercel.json` decides where `/api` requests go:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-domain.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Change that first address to your domain and push. This is what keeps the browser talking to one address only, which is what makes the login cookie work.

Then go back and make sure `CLIENT_URLS` in your settings files lists the Vercel address. If it does not, the backend refuses every request from the website.

## Step 7: let GitHub do the deploying

Your server has no SSH port open to the internet. Instead, GitHub joins your private Tailscale network and reaches the server through that.

**On the server:**

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

**In the Tailscale admin pages:** create an OAuth client with write access to devices, and allow the tag `tag:ci` in your access rules.

**Make a key so GitHub can log in**, on the server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy       # the private key, copy all of it
```

**In GitHub**, under Settings → Secrets and variables → Actions, add:

| Secret | What to put in it |
|---|---|
| `TS_OAUTH_CLIENT_ID` | From the Tailscale OAuth client |
| `TS_OAUTH_SECRET` | From the Tailscale OAuth client |
| `VPS_HOST` | The server's Tailscale name or address |
| `VPS_USER` | The user that owns `/opt/quizloom` |
| `VPS_SSH_KEY` | The private key you just printed, all of it |
| `TEST_ADMIN_EMAIL` | Optional, turns on the tests after each deploy |
| `TEST_ADMIN_PASSWORD` | Optional |
| `TEST_TEACHER_EMAIL` | Optional |
| `TEST_TEACHER_PASSWORD` | Optional |

The tests skip themselves when the `TEST_` values are missing, so you can add them later.

Last, create an environment called `production` under Settings → Environments. The deploy uses it, and it is where you can add an approval step if you want one.

---

## What happens when you push

Push to `main` and [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) runs two jobs.

**Lint and build**, on every push and every pull request:

1. Install everything.
2. Check the code with ESLint.
3. Build the website, only to prove it still builds. Vercel does the real one.

**Deploy to the VPS**, only on a push to `main`, and only if the first job passed:

1. Join the private network.
2. Set up the SSH key.
3. Send `scripts/deploy.sh` to the server and run it there, with the commit you pushed.
4. Run the tests against the live site.

The script is sent over each time rather than run from the copy on the server. That way the server always runs the version from the commit being deployed, and rebuilding cannot pull the running script out from under itself.

On the server, [`scripts/deploy.sh`](../scripts/deploy.sh) does this:

1. Note which commit is currently live.
2. Fetch, then switch the code to the new commit.
3. Rebuild and restart the containers.
4. Check `/api/health` and all five ready addresses, up to 30 times, 5 seconds apart.
5. If they answer, clean up old images and finish.
6. If they never answer, print the last 50 log lines, switch back to the old commit, rebuild, and fail.

So a broken deploy puts the old version back on its own and marks the run as failed. If the old version does not come back either, the script says so and stops, and the server needs looking at by hand.

Your settings files are never touched by any of this.

## Checking a deploy worked

From anywhere:

```bash
curl https://your-domain.com/api/health
```

On the server:

```bash
cd /opt/quizloom
git log --oneline -1        # the commit you pushed
docker compose ps           # everything Up
docker compose logs --tail=50 quiz
```

---

## Day to day

**Change a setting.** Edit the `.env.production` file on the server, then restart that service. Settings are only read at startup:

```bash
cd /opt/quizloom
docker compose up -d --force-recreate auth
```

**Go back to an older version.** A deploy only undoes itself. To go further back, do it by hand:

```bash
cd /opt/quizloom
git reset --hard <older-commit>
docker compose up -d --build
```

**Read the logs.**

```bash
docker compose logs -f exam-worker
docker compose logs --since 30m quiz
```

**Restart one service.**

```bash
docker compose restart scheduler
```

**Never run `npm run reset` on the server.** It clears Redis, which throws away messages that were never delivered. It is for your own machine only.

## What this setup does not do

Know these before you rely on it:

- **No database backups.** Whatever Neon keeps on your plan is all you have.
- **Nothing watches it.** Nobody is told when a service falls behind or a message fails for good.
- **One of everything.** One Redis, one server, one gateway. If Redis is down, quizzes do not start or end on time.
- **No automatic restarts on failure** beyond Docker's own, and no memory limits.
- **Logs stay on the server** and are not copied anywhere.
- **Teacher passwords are stored as plain text**, so the admin screen can show them.

## When a deploy fails

**It fails at joining the network.** The Tailscale values are wrong, or your access rules do not allow `tag:ci`.

**It fails at the SSH step.** `VPS_HOST`, `VPS_USER` or `VPS_SSH_KEY` is wrong. Check the public key really is in `~/.ssh/authorized_keys` for that user.

**It fails at the deploy step but the site still works.** The old version came back, as intended. The real error is in the log lines printed just above the rollback.

**Nothing answers after a settings change.** A service cannot reach its database. Check each `/api/<service>/ready` to find which one, then read its logs.

**The site loads but nothing works.** Either `CLIENT_URLS` is missing your Vercel address, or `vercel.json` points at the wrong backend.

**People get signed out straight away.** `COOKIE_SECURE` has to be true on the server, and the site has to be on HTTPS.

More problems and causes: [Troubleshooting](./14_troubleshooting.md).

## Related documentation

- [Running on your own machine](./local_deploy.md)
- [Deployment reference](./12_deployment.md) — every setting, in one table
- [Architecture](./1_architecture.md)
- [Testing](./13_testing.md)
