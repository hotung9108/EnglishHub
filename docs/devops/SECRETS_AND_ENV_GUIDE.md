# EnglishHub — Secrets & Environment Variables Guide (DevOps)

> **Audience**: @devops-primary, @devops-secondary, @be-primary (for local setup).
> **Purpose**: List **every** secret key / token used across the project, grouped by where it lives,
> how to obtain it, how to use it, and **exactly where to place it** so CI/CD and the running
> system actually work.
>
> **Golden rule**: Real `.env` files are **gitignored** — never commit real values.
> Only the `*.example` templates live in the repo. The `security-scan.yml` workflow runs
> TruffleHog on every push/PR and will flag leaked secrets.

There are **3 places** secrets live:

| # | Location | Used by |
|---|----------|---------|
| 1 | **GitHub Actions Secrets** (repo Settings → Secrets and variables → Actions) | CI/CD workflows in `.github/workflows/` |
| 2 | **Server `.env` files** (on the deploy machine, under `/home/<SERVER_USER>/`) | docker-compose.prod.yml / staging / tunnel / ai-service |
| 3 | **Local dev `.env` files** (on each developer's PC) | Local backend, ai-service, frontend |

---

## 1. GitHub Actions Secrets

Set at: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**.
These are referenced as `${{ secrets.X }}` in the workflows.

### 1.1. Group A — Server / SSH / Tunnel (used by CD-Backend, CD-AI-Service, CD-*-development)

| Secret | Used in | How to get it | How to use / notes |
|--------|---------|---------------|--------------------|
| `SERVER_HOST` | `cd-backend.yml`, `cd-ai-service.yml`, `cd-backend-development.yml` | The deploy PC's Tailscale IP (e.g. `100.x.y.z`) or its Tailscale MagicDNS name (`pcname.tailnet-name.ts.net`). Find it with `tailscale ip -4` on the server. | The runner SSHes into this host to run `docker compose`. Must be reachable **over Tailscale** (the workflow connects via `TAILSCALE_AUTHKEY` first). |
| `SERVER_USER` | same | Linux username on the deploy PC (e.g. `tuan-pham`). | Also used as the GHCR login username and to build paths `/home/<SERVER_USER>/englishhub`, `/home/<SERVER_USER>/ai-service`, `/home/<SERVER_USER>/tunnel`. |
| `SSH_PRIVATE_KEY` | same | Generate a **new** ed25519 keypair on the deploy PC: `ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""`. Copy the **public** key into `~/.ssh/authorized_keys` of `SERVER_USER`. | Paste the **entire private key** (including `-----BEGIN/END OPENSSH PRIVATE KEY-----` lines) as the secret value. Used by `appleboy/ssh-action`. |
| `GHCR_PAT` | same | GitHub → Settings → Developer settings → **Personal access tokens → Fine-grained tokens** → Generate. Grant it to owner repo `hotung9108/english-hub` with permission: **Packages → Read** (or classic token with `read:packages`). Must belong to an account that can pull `ghcr.io/hotung9108/english-hub-*`. | Echoed into `docker login ghcr.io` **on the server** so it can pull the images the CI just pushed. The CI itself uses the built-in `GITHUB_TOKEN`. |
| `TAILSCALE_AUTHKEY` | `cd-backend.yml`, `cd-ai-service.yml`, `cd-backend-development.yml` | Tailscale admin console → **Settings → Keys → Generate auth key**. Enable **Reusable** and **Pre-authorized** (and ideally **Ephemeral**) so the GitHub runner can join the tailnet without manual approval. | Lets the ephemeral GitHub Actions runner join your tailnet so SSH to `SERVER_HOST` works. Key is consumed per run if non-reusable. |

### 1.2. Group B — Vercel Frontend Deploy (used by CD-Frontend, CD-Frontend-development)

| Secret | Used in | How to get it | How to use / notes |
|--------|---------|---------------|--------------------|
| `VERCEL_TOKEN` | `cd-frontend.yml`, `cd-frontend-development.yml` | Vercel account avatar → **Settings → Account → Tokens → Create Token**. Pick the account/team that owns the frontend project. | Passed as `--token` to every `vercel` CLI call in CI (`pull`, `build`, `deploy --prebuilt --prod`). |
| `VERCEL_ORG_ID` | `cd-frontend.yml` (production) | From the frontend directory, run `vercel link` then read `.vercel/project.json` → `"orgId"`; or Vercel dashboard → Project → Settings → General. | Exposed to the build as env `VERCEL_ORG_ID`. |
| `VERCEL_PROJECT_ID` | `cd-frontend.yml` (production) | Same file `.vercel/project.json` → `"projectId"` (production project). | Env `VERCEL_PROJECT_ID`. |
| `VERCEL_ORG_ID_DEV` | `cd-frontend-development.yml` (staging/dev deploy) | Same as above but for the **development** Vercel project (separate project, e.g. `englishhub-dev`). | Env for the dev workflow. |
| `VERCEL_PROJECT_ID_DEV` | `cd-frontend-development.yml` | Project ID of the dev Vercel project. | Env for the dev workflow. |

### 1.3. Group C — Automatic (no setup needed)

| Secret | Notes |
|--------|-------|
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions per run. Used to log in to GHCR during CI build/push (`packages: write` permission is declared in the workflow). **Do not** create this manually. |

---

## 2. Server Environment Files (deploy machine)

These are **plain `.env` files on the server**, created once by hand and never committed.
Each docker-compose file reads its own env file.

### 2.1. `/home/<SERVER_USER>/englishhub/.env` — Backend PROD
Template in repo: `env.production.example` (used by `docker-compose.prod.yml` and `docker-compose.staging.yml`;
staging instance lives in `/home/<SERVER_USER>/englishhub-dev` per the dev workflow).

```bash
cd /home/<SERVER_USER>/englishhub
cp env.production.example .env   # or copy the template file over manually
nano .env
```

| Variable | How to obtain | Notes |
|----------|---------------|-------|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | **Neon** dashboard (https://console.neon.tech) → your project → **Connection Details** → JDBC. | Serverless Postgres. `sslmode=require` must stay. |
| `JWT_SECRET` | Generate ≥32 random chars: `openssl rand -base64 48`. | Must match between backend instances; rotating it invalidates all tokens. |
| `CORS_ALLOWED_ORIGINS` | Your real frontend domains (e.g. `https://englishhub.io,https://www.englishhub.io`). | `*` only for quick testing. |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys → Create new secret key. | Used by the backend's AI-grading integration. |
| `STORAGE_S3_ENDPOINT`, `STORAGE_S3_REGION`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`, `STORAGE_S3_BUCKET` | S3-compatible provider (AWS S3 / Cloudflare R2 / MinIO). AWS: IAM → Users → Create access key. R2: Bucket → S3 API token. See `docs/devops/s3-config-guide.md`. | Keep `STORAGE_S3_PATH_STYLE=true` for MinIO. |
| `BACKEND_IMAGE` | Set automatically by the CD pipeline (`sed` replaces the tag with the deploy SHA). | Leave the `latest` placeholder from the template. |
| `AI_SERVICE_BASE_URL`, `AI_SERVICE_*_TIMEOUT_SECONDS`, `AI_SERVICE_MODEL`, `AI_SERVICE_PROVIDER` | Defaults in template are fine when AI service runs on the same Docker network (`englishhub_shared`). | Do **not** put AI provider keys here — they go in the AI service env (§2.3). |
| `BACKEND_PORT`, `SERVER_PORT`, `SERVER_FORWARD_HEADERS_STRATEGY`, `APP_OPENAPI_SERVER_URL`, `JAVA_TOOL_OPTIONS` | Not secrets — keep template values, adjust URL per env. | `SERVER_FORWARD_HEADERS_STRATEGY=framework` is required behind Cloudflare Tunnel. |

### 2.2. `/home/<SERVER_USER>/tunnel/.env` — Cloudflare Tunnel
Template in repo: `env.tunnel.example` (used by `docker-compose.tunnel.yml`).

| Variable | How to obtain | Notes |
|----------|---------------|-------|
| `TUNNEL_TOKEN` | Cloudflare Zero Trust dashboard → **Networks → Tunnels** → your tunnel → configure → copy the token shown in the run command (`cloudflared tunnel run --token eyJ...`). | Single opaque token; `docker-compose.tunnel.yml` uses it instead of a full config file. |

### 2.3. `/home/<SERVER_USER>/ai-service/.env` — AI Microservice
Template in repo: `env.ai-service.example` (used by `docker-compose.ai-service.yml`).
The CD pipeline auto-copies the example if the file is missing, then sets `AI_SERVICE_IMAGE` — but **you must fill the API keys manually once**.

```bash
cd /home/<SERVER_USER>/ai-service
cp env.ai-service.example .env
```

| Variable | How to obtain | Notes |
|----------|---------------|-------|
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys → Create Key (starts with `sk-or-v1-`). | Primary provider (`AI_PROVIDER=auto` prefers OpenRouter). |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey. | Fallback provider; optional if OpenRouter key is set. |
| `AI_PROVIDER` | Choose `auto` \| `openrouter` \| `gemini`. | `auto` = OpenRouter first, Gemini fallback. |
| `OPENROUTER_MODEL`, `GEMINI_MODEL` | Defaults in template (`google/gemini-2.5-flash`, `gemini-2.5-flash`) are fine. | Override for other models. |
| `AI_SERVICE_MOCK_MODE` | `true` for offline/benchmark (QA-21), `false` in production. | Mock mode needs no API keys at all. |
| `CORS_ALLOWED_ORIGINS`, `AI_SERVICE_PORT`, `AI_SERVICE_REQUEST_TIMEOUT_SECONDS`, `AI_SERVICE_MAX_RETRIES`, `AI_SERVICE_IMAGE` | Not secrets / auto-managed. | Image tag is rewritten by CD. |

---

## 3. Local Developer Machine `.env` files

### 3.1. Frontend — `frontend/.env`
Template: `frontend/env.frontend.example`.

```bash
cd frontend
cp env.frontend.example .env
```

| Variable | How to obtain | Notes |
|----------|---------------|-------|
| `VITE_API_BASE_URL` | Your local backend URL (default `http://localhost:8080/api/v1`). | For staging/prod you can point at the tunnel URL (`https://api.hotung9108.me/api/v1`). |
| `VITE_APP_ENV` | `development` \| `staging` \| `production`. | Display/debug only. |

### 3.2. Backend — `backend/.env` (local dev)
Same shape as §2.1 but pointing to local resources (local Postgres or Neon dev branch, local MinIO, etc.).
Copy `env.production.example` and adjust, or follow `docs/setup/DEV_ENVIRONMENT_GUIDE.md`.

### 3.3. AI service — `ai-service/.env` (local dev)
Copy `env.ai-service.example` → `ai-service/.env` and fill `OPENROUTER_API_KEY` and/or `GEMINI_API_KEY`,
or set `AI_SERVICE_MOCK_MODE=true` to run fully offline.

---

## 4. Quick setup checklist (new environment)

1. **GitHub repo secrets** — create all secrets in §1.1 and §1.2 (9 manual secrets total + auto `GITHUB_TOKEN`).
2. **Server folders** — ensure these exist with the right `.env` files:
   - `/home/<SERVER_USER>/englishhub/.env` (from `env.production.example`)
   - `/home/<SERVER_USER>/englishhub-dev/.env` (staging, same template)
   - `/home/<SERVER_USER>/ai-service/.env` (from `env.ai-service.example`, keys filled)
   - `/home/<SERVER_USER>/tunnel/.env` (from `env.tunnel.example`)
3. **Shared Docker network** — CD creates it automatically, but you can pre-create:
   `docker network create englishhub_shared`
4. **SSH keypair** — public key in `~/.ssh/authorized_keys` of `SERVER_USER`, private key in the `SSH_PRIVATE_KEY` secret.
5. **Tailscale** — deploy PC joined to the tailnet; auth key in `TAILSCALE_AUTHKEY`.
6. **Vercel** — frontend linked (`vercel link`), org/project IDs in secrets, `VERCEL_TOKEN` valid.
7. Verify with a test push: CI → CD should build, push to GHCR, SSH in, pull and `docker compose up`.

## 5. Security notes

- Never commit real `.env` files — `.gitignore` covers them; TruffleHog (`security-scan.yml`) verifies on every push/PR.
- Prefer **fine-grained PATs** with minimal scope (`read:packages` only) for `GHCR_PAT`.
- Rotate `JWT_SECRET`, `SSH_PRIVATE_KEY`, `TAILSCALE_AUTHKEY`, and provider API keys immediately if leaked.
- Store personal copies of production secrets in a password manager, not in chat or tickets.
