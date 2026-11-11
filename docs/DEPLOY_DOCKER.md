# Docker deploy

Self-host the Singular/ty Command Hub in one command.

## One-liner (Docker Compose)

```bash
git clone https://github.com/s3v3nlabs/command-hub.git && cd command-hub && docker compose up -d --build
```

Then open <http://localhost:3100>.

Optional: copy secrets first so the hub picks them up:

```bash
cp .env.example .env.local   # fill in only the names you use (never commit values)
docker compose up -d --build
```

## Plain Docker (no compose)

```bash
docker build -t command-hub .
docker run -d --name command-hub -p 3100:3100 \
  --env-file .env.local \
  -v command-hub-data:/app/data \
  -v command-hub-local-data:/app/local-data \
  command-hub
```

## What's in the image

- Multi-stage build (`Dockerfile`): `npm ci` + `next build`, then a lean
  `node:22-slim` runtime that runs `next start` on port **3100** as a non-root
  user, with a container healthcheck.
- Local-first stores (`data/`, `local-data/`) are mounted as named volumes so
  engagements, CCTV layouts, IDS history, marketplace install state, and the
  Heimdall eyes-only log survive restarts.

## Updating a running deployment

```bash
git pull origin main
docker compose up -d --build        # rebuild + restart, volumes preserved
```

Roll back by checking out a previous tag/commit and rebuilding (see
"Updating & Upgrading" in USAGE.md). Volumes are untouched by a rollback.

## Hosted demo instance (instructions only)

> This repo does not provision external infrastructure. These are the steps an
> operator follows to stand up a public demo; run them yourself.

1. **Any Docker host** (a small VPS, Fly.io, Railway, Render, a home server):
   - Provision a host with Docker + Docker Compose.
   - `git clone` + `docker compose up -d --build` as above.
   - Put it behind a reverse proxy (Caddy/nginx/Traefik) with TLS.
   - Set `HUB_API_TOKEN` and `SECURE_MODE=1` in `.env.local` so mutating routes
     require a Bearer token on a public instance.
2. **Vercel** (frontend-style hosting):
   - Import the GitHub repo in Vercel; framework autodetects Next.js 15.
   - Note: file-backed stores under `data/`/`local-data/` are **ephemeral** on
     serverless — use the Docker/VPS path for persistent engagements.
   - Add env vars in the Vercel dashboard (`HUB_API_TOKEN`, `REGISTRY_INDEX_URL`,
     `REGISTRY_PUBLIC_KEY`, `HEIMDALL_LOG_KEY`, etc.).
3. **Harden before exposing**: enable `SECURE_MODE=1`, set `HUB_API_TOKEN`,
   configure `HEIMDALL_LOG_KEY`, and review `SECURITY.md`. The demo should run
   with lab-only data; never point offensive capabilities at third parties.
