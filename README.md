# Daymark Todo

A small full-stack todo app in a JavaScript monorepo. Two images: **web** (nginx serving the HTML/CSS/JS and proxying `/api` to the backend) and **api** (Express JSON API). PostgreSQL stores tasks and Redis caches the task list.

```
browser -> web (nginx :80, load balancer) --/api--> api x3 (Express :3000) -> postgres, redis
```

## Run the full stack

You need Docker Desktop with Docker Compose.

```bash
docker compose up --build
```

Open http://localhost:8080. The API runs as three replicas behind nginx, which spreads requests across them round-robin; every API response has an `X-Served-By` header with the container ID that answered. Change the count with `docker compose up -d --scale api=5`. The first run builds both images and starts PostgreSQL and Redis. Stop with `Ctrl+C`; run `docker compose down` to stop and remove the containers. Task data stays in the `postgres-data` volume.

## Run backend tests

```bash
npm install
npm test
```

The API tests use in-memory repository and cache fakes, so they do not need Docker or running databases.

## Local API development

Start PostgreSQL and Redis with `docker compose up -d postgres redis`, then run:

```bash
npm install
npm run dev
```

The local server defaults to port 3000 and uses the connection URLs in `.env.example`.

## API

- `GET /api/health`
- `GET /api/todos`
- `POST /api/todos` with `{ "title": "..." }`
- `PATCH /api/todos/:id` with `{ "title": "..." }` or `{ "completed": true }`
- `DELETE /api/todos/:id`

## Build the images

```bash
docker build -f apps/api/Dockerfile -t daymark-api .   # backend, built from repo root (workspace lockfile)
docker build -t daymark-web apps/web                   # frontend
```

## Deploy to EC2

Both workflows run manually from the GitHub **Actions** tab (*Run workflow*) and use the files in [deploy/](deploy/).

| Workflow | How the images reach EC2 |
| --- | --- |
| [Deploy to EC2 (images over SSH)](.github/workflows/deploy-ssh.yml) | Built on the runner, `docker save` to a tarball, `scp` to EC2, `docker load` |
| [Deploy to EC2 (via Docker Hub)](.github/workflows/deploy-dockerhub.yml) | Built on the runner and pushed to Docker Hub, then `docker pull` on EC2 over SSH |

### One-time EC2 setup (Ubuntu)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in afterwards
```

Security group inbound rules: port 22 (SSH, from anywhere so GitHub runners can connect) and port 80 (HTTP).

### Repository secrets

| Secret | Value |
| --- | --- |
| `EC2_HOST` | Public IP or DNS of the instance |
| `EC2_USER` | `ubuntu` for Ubuntu AMIs |
| `EC2_SSH_KEY` | Full contents of the `.pem` key file |
| `POSTGRES_PASSWORD` | Database password (letters and digits only) |
| `DOCKERHUB_USERNAME` | Docker Hub username (Docker Hub workflow only) |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Docker Hub workflow only) |

Postgres sets the password only when its volume is first created; changing the secret later needs `docker compose -f docker-compose.prod.yml down -v` on the server, which deletes the data.
