# Putting QuizLoom on a real server

From an empty server to a live site that updates itself every time you push. Read [Running on your own machine](./local_deploy.md) first if you have never started the stack at all.

There are three pieces, and each one gets there a different way:

| Piece                        | Lives on   | Updated by                     |
| ---------------------------- | ---------- | ------------------------------ |
| The backend, nine containers | one server | pushing to`main`             |
| The website                  | Vercel     | Vercel, watching the same repo |
| Five databases               | Neon       | you, once                      |

Steps 1 to 7 you do once. After that, deploying is `git push`.

---

## What you need first

- A server with at least 2 GB of memory and 30 GB of disk, reachable on ports 22, 80 and 443. An AWS EC2 `t3.small` works; so does any Ubuntu machine. The disk matters because every deploy pulls a fresh set of images.
- A domain name pointing at that server.
- A [Neon](https://neon.tech) account for the databases.
- A [Vercel](https://vercel.com) account for the website.

## Step 1: create the five databases

The same five as on your own machine, one per service:

`auth_db`, `questionbank_db`, `quiz_db`, `exam_db`, `analytics_db`

Use the connection string with **`-pooler`** in the address. Each service opens up to 20 connections at once, and six services on the plain address will run you out.

Keep the five strings somewhere safe. You need them in step 3.

No tables to create. Each service builds its own when it first starts.

## Step 2: set up the server

The server needs to accept traffic on **22** (so GitHub can deploy), **80** and **443** (the site). On a cloud VM that is a firewall or security group rule. Nothing else should be open. The gateway listens on 8080 but only your host nginx talks to it, so it does not need a rule.

If the machine has a changing public address, give it a fixed one now. On EC2 that is an Elastic IP, free while it is attached to a running instance. Your domain's A record points at it, and so does the `EC2_HOST` secret later.

Log in and install everything:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git nginx certbot python3-certbot-nginx fail2ban
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

The compose package is **`docker-compose-v2`**, which is what Ubuntu calls it. `docker-compose-plugin` is Docker's own name for the same thing and only exists if you add Docker's apt repository, so asking for it here fails. Watch for that: apt installs nothing at all when one name in the list is wrong, and then every later command fails with "docker.service does not exist".

`fail2ban` matters because port 22 is open to the internet: it bans addresses that fail SSH logins repeatedly, and its defaults need no configuration.

Add swap. Pulling images and restarting containers is light work, but 2 GB of memory has no slack, and swap is what stops the kernel killing a service when something spikes:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Log out and back in so the docker group takes effect, then check both:

```bash
docker compose version
free -h            # the Swap row should show 2.0Gi
```

Now put the code in `/opt/quizloom`. That path matters, it is what the deploy expects.

The server only needs the compose file, the gateway config, and the service folders. It never serves the React app or reads the docs, so check out just those parts:

```bash
sudo mkdir -p /opt/quizloom
sudo chown $USER:$USER /opt/quizloom
git clone --no-checkout https://github.com/prawesh-12/quiz-platform.git /opt/quizloom
cd /opt/quizloom
git sparse-checkout init --cone
git sparse-checkout set gateway docker services
git checkout main
```

That leaves out `client/`, `public/`, `docs/` and `tests/`, about 4 MB of frontend and images. Files at the root, like `docker-compose.yml`, always come along. Deploys keep working because `git reset --hard` only writes files inside the checked-out set.

If you ever want one of the skipped folders on the box, add it: `git sparse-checkout add docs`.

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

| Setting                   | On your machine       | On the server                                         |
| ------------------------- | --------------------- | ----------------------------------------------------- |
| `COOKIE_SECURE`         | false                 | **true**                                        |
| `CLIENT_URLS`           | http://localhost:5173 | your public site, like`https://quizloom.vercel.app` |
| `CLIENT_URL`, quiz only | http://localhost:5173 | the same public site                                  |
| `DATABASE_URL`          | test databases        | the Neon strings from step 1                          |

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

Every later deploy pulls ready-made images from GitHub, but for this first run there is nothing published yet, so build them here:

```bash
cd /opt/quizloom
docker compose up -d --build
```

This builds seven images, so the first run takes several minutes. When it settles:

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

The stack serves plain HTTP on port 8080, and that port is not open to the internet. A second nginx, running on the host, takes public traffic on 443 and passes it to 8080. Nothing in this repo does certificates, so you set that up here. nginx and certbot came with step 2.

**First, point your domain at the server.** Add an A record for `your-domain.com` to the server's public address. Certbot proves you own the domain by answering a request on port 80, so this has to work before you go on. Check it:

```bash
dig +short your-domain.com     # should print your server's IP
```

**Write the site config:**

```bash
sudo tee /etc/nginx/sites-available/quizloom > /dev/null <<'CONF'
server {
    listen 80;
    server_name your-domain.com;

    # Avatar uploads are up to 2MB and the gateway allows 3m. nginx defaults to 1m,
    # which would reject them here before they ever reach the app.
    client_max_body_size 3m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
CONF
```

Change `your-domain.com` on the `server_name` line to your own domain. `X-Forwarded-Proto` matters: it is how the services know the request arrived over HTTPS, which is what makes the secure session cookie work.

**Turn it on**, drop nginx's placeholder site, and check the config parses before reloading:

```bash
sudo ln -sf /etc/nginx/sites-available/quizloom /etc/nginx/sites-enabled/quizloom
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` must say "syntax is ok" and "test is successful". Now it should answer over plain HTTP:

```bash
curl http://your-domain.com/api/health
```

**Then get the certificate:**

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot asks for an email, then rewrites the file you just wrote to listen on 443 with the certificate, and adds a redirect from 80. It installs a timer that renews automatically, so there is nothing to remember. Check from your laptop:

```bash
curl https://your-domain.com/api/health
```

A 200 here means the whole chain works: HTTPS, the host nginx, the gateway container, and the exam service behind it.

Nothing else on the server listens publicly. Only the gateway publishes a port, 8080, and only your host nginx talks to it. Redis is published on 6379 by `docker-compose.dev.yml`, the local overlay, which the server never uses, so on this machine Redis exists only inside Docker's own network.

Do not reach for `ufw` to tighten this. On a cloud VM the security group is the firewall, a bare `ufw deny` does nothing until ufw is enabled, and enabling ufw without first allowing 22 locks you out of your own server.

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

Four things: make a key on the server, paste four secrets into GitHub, create one environment, push.

### 1. Make an SSH key, on the server

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy
```

That last command prints the private key. Copy the whole thing, including the
`-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.

### 2. Add four secrets, in GitHub

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add these four, one at a time:

| Name | Value | Example |
|---|---|---|
| `EC2_HOST` | the server's address | `your-domain.com` |
| `EC2_USER` | the Linux user that owns `/opt/quizloom` | `ubuntu` |
| `EC2_SSH_KEY` | the private key from step 1, in full | `-----BEGIN OPENSSH PRIVATE KEY-----`… |
| `GATEWAY_URL` | your public site, used only by the tests | `https://your-domain.com` |

Nothing is needed for the image registry. The workflow signs in to GHCR with the token GitHub issues to every run, and the images land at `ghcr.io/<your-username>/quizloom/<service>`, private to you.

### 3. Create the production environment

**Settings** → **Environments** → **New environment** → name it `production` → **Configure environment**. Leave everything at its defaults and save. The deploy job targets this name, and it is where you would later add an approval gate if you want one.

### 4. Push

```bash
git push origin main
```

Open the **Actions** tab. You should see three jobs run in order:

1. **Lint and build** — lint, unit tests, event tests, client build
2. **Build and push images** — seven images to GHCR
3. **Deploy to EC2** — SSH in, pull, restart, health-check

If all three are green, deploying is now just `git push`.

### Optional: turn on the post-deploy tests

Add these four secrets and the last job starts asserting against the live site instead of skipping:

| Name | Value |
|---|---|
| `TEST_ADMIN_EMAIL` | the admin email from `services/auth/.env.production` |
| `TEST_ADMIN_PASSWORD` | the plain admin password |
| `TEST_TEACHER_EMAIL` | a teacher account you created |
| `TEST_TEACHER_PASSWORD` | that teacher's password |

The tests skip themselves when these are missing, so a green run without them proves less than it looks. Read the output.

---

## What happens when you push

Push to `main` and [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) runs two jobs.

**Lint and build**, on every push and every pull request:

1. Install everything.
2. Check the code with ESLint.
3. Run the unit and event tests.
4. Build the website, only to prove it still builds. Vercel does the real one.

**Build and push images**, only on a push to `main`: builds all seven images and pushes them to GHCR tagged with the commit SHA. This is why your server does not need build memory. The seven builds run in parallel on GitHub's machines and reuse a layer cache between runs.

**Deploy to EC2**, only if the images were pushed:

1. Set up the SSH key.
2. Send `scripts/deploy.sh` to the server and run it there, with the commit you pushed.
3. Run the tests against the live site.

The script is sent over each time rather than run from the copy on the server. That way the server always runs the version from the commit being deployed, and rebuilding cannot pull the running script out from under itself.

On the server, [`scripts/deploy.sh`](../scripts/deploy.sh) does this:

1. Note which commit is currently live.
2. Fetch, then switch the code to the new commit.
3. Write `.env` with the image repo and the commit tag, pull those images, and restart the containers.
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

**Go back to an older version.** A deploy only undoes itself. To go further back, pick a commit that CI has built and point the stack at its images:

```bash
cd /opt/quizloom
git reset --hard <older-commit>
printf 'IMAGE_REPO=ghcr.io/<your-username>/quizloom\nIMAGE_TAG=<older-commit>\n' > .env
docker compose pull
docker compose up -d
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

**It fails at the SSH step.** `EC2_HOST`, `EC2_USER` or `EC2_SSH_KEY` is wrong. Check the public key really is in `~/.ssh/authorized_keys` for that user.

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
