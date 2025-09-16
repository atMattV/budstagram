Operational guide for automation agents (Codex, CI bots, etc.) working on Budstagram.

0) Mission & Scope

Mission: Keep Budstagram (Next.js 14 + Prisma + Neon + Vercel Blob) building, deploying, and minimally functional (feed + admin uploader).

Scope: Infra glue, DX, bug fixes, small features.

Out of scope: Large refactors, stack swaps, breaking schema changes without maintainer approval.

1) Project Snapshot

Stack: Next.js 14 (App Router), Tailwind, TypeScript, Prisma, Postgres (Neon), Vercel Blob, Basic Auth for /admin.

Entry points:

Public feed: /

Admin uploader (protected): /admin

API: /api/posts (GET: paginated list; POST: upload to Blob + insert row)

2) Golden Rules (Do/Don’t)

Do

Keep changes minimal, reversible, and documented.

Preserve existing env contract; never hardcode secrets.

Prefer small PRs with a clear checklist and logs.

Don’t

Don’t change the storage provider (Vercel Blob) or DB (Neon) without instruction.

Don’t introduce new services or SaaS unless strictly required for build to pass.

Don’t push commits with unvetted codegen that breaks npm run build.

3) Secrets & Env

Required env vars (read from .env / CI settings):

DATABASE_URL (Neon, includes ?sslmode=require)

ADMIN_USER (string; current owner prefers: The Chisp)

ADMIN_PASS (string)

BLOB_READ_WRITE_TOKEN (Vercel Blob RW token)

Never echo, log, or commit secrets. If missing, fail fast with a helpful message.

4) Install / Build / Run Pipelines
Local (reference)
npm install
npx prisma migrate dev --name init   # first run only
npm run dev                          # http://localhost:3000

CI / Agent pipeline

Environment probe

node -v && npm -v
npm config get registry


Force public registry (avoid 403)

npm config set registry https://registry.npmjs.org/
npm config set @prisma:registry https://registry.npmjs.org/
npm config set fetch-retries 5
npm config set fetch-retry-maxtimeout 120000


If corporate proxy is present, set HTTP_PROXY/HTTPS_PROXY. Avoid strict-ssl=false unless absolutely necessary.

Clean install

rm -rf node_modules package-lock.json
npm install --verbose
npx prisma generate --print-version


If Prisma binary download is blocked by egress, skip install (see §8 Fallback) and mark job as non-authoritative.

Type check & build

npm run build

5) Coding Standards

TypeScript, ES2022, no any unless guarded.

Keep components server-first; client components only when necessary (stateful UI).

Tailwind for styling; no custom global CSS unless needed.

API routes must return JSON with stable shapes:

GET /api/posts?cursor=ISO_DATE → { items: Post[], nextCursor?: string|null }

POST /api/posts (FormData: file, caption) → 201 { ...post } | 4xx/5xx { error }

Pagination sorted by createdAt desc, cursor is ISO timestamp of last item.

6) Branch & PR Hygiene

Branch names: fix/<short>, chore/<short>, feat/<short>.

PR title format: [fix|chore|feat]: <concise summary>

PR body includes:

“What changed”

“Why”

“Risk”

“How to test” (exact commands/URLs)

“Env vars touched” (if any)

Logs/snippets for failing/success paths

Keep diffs focused. Avoid drive-by reformatting beyond touched lines.

7) Common Tasks (Playbooks)
7.1 Resolve npm install 403 on @prisma/*
npm config set registry https://registry.npmjs.org/
npm config set @prisma:registry https://registry.npmjs.org/
rm -rf node_modules package-lock.json
npm install --verbose
npx prisma generate --verbose


If still failing due to proxy:

Set CI env: NPM_CONFIG_REGISTRY=https://registry.npmjs.org/

If proxy required: set HTTPS_PROXY/HTTP_PROXY (from CI secrets)

7.2 Migrate DB (first run or schema change)
npx prisma migrate dev --name <change>


Never drop data in CI. Local only. For production migrations, open a PR with migration SQL and instructions.

7.3 Blob upload failures (500)

Check BLOB_READ_WRITE_TOKEN exists and has RW scope in Vercel.

Confirm next.config.mjs allows **.blob.vercel-storage.com in images.remotePatterns.

7.4 Admin auth 401 loop

Ensure both ADMIN_USER and ADMIN_PASS are present.

Don’t log the credentials. Confirm via sanitized config echo.

8) Fallback When CI Is Blocked by Proxy

If registry/binaries are blocked and cannot be fixed within the job:

Do not fail the PR. Mark status as skipped/non-authoritative with message:

“Install blocked by proxy (npm/Prisma engines). Structure validated; defer authoritative build to Vercel.”

Ensure the PR still:

Includes .npmrc with the public registry pins.

Passes a lint/tsc dry-run if possible without full install (otherwise skip with reason).

Post diagnostic info (no secrets): Node/NPM versions, npm config get registry, whether proxy envs were present.

9) File & Directory Policy

Don’t introduce extra top-level folders without need.

Place shared libs in src/lib, UI in src/components, server/API in src/app/api.

No generated files in VCS (.next, node_modules, Prisma client outputs).

10) Error Messaging & Logs

API errors: JSON { error: string }, meaningful and concise. No stack traces.

CI logs: redact tokens/URLs; include exit codes and last 30 lines of relevant output.

11) Deployment Notes (Vercel)

Build uses repo package.json scripts.

Required envs in Vercel Project Settings:

DATABASE_URL, ADMIN_USER, ADMIN_PASS, BLOB_READ_WRITE_TOKEN

First successful deploy yields https://<project>.vercel.app/. Custom domain added later.

12) Acceptance Checklist (per PR)

 No secrets added/echoed.

 npm install path documented or fallback reason explained.

 npx prisma generate succeeds or is explicitly skipped due to proxy constraints.

 npm run build succeeds locally or on Vercel.

 API contracts unchanged unless documented.

 README updated if commands/env changed.

13) Contact & Owner Preferences

Admin username preference: “The Chisp” (do not hardcode credentials).

Keep changes terse; add runnable commands in PR body.
