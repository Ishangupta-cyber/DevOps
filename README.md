# Daymark Todo

A small full-stack todo app in a JavaScript monorepo. Express serves the HTML/CSS/JS frontend and JSON API; PostgreSQL stores tasks and Redis caches the task list.

## Run the full stack

You need Docker Desktop with Docker Compose.

```bash
docker compose up --build
```

Open http://localhost:3000. The first run builds the app image and starts PostgreSQL and Redis. Stop with `Ctrl+C`; run `docker compose down` to stop and remove the containers. Task data stays in the `postgres-data` volume.

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

## Build a Docker image

```bash
docker build -t daymark-todo .
```

For the complete app, including its PostgreSQL and Redis services, use `docker compose up --build`.