# Budstagram – MVP

Instagram-style feed for Bud with a private admin uploader.

## 0) Prereqs
- Node 18+
- Vercel account
- Neon (Postgres) account (free tier)

## 1) Clone & install
```bash
npm i
```

## 2) Create Postgres (Neon)
- Create a new project (Postgres 15), copy the connection string with `?sslmode=require`.
- Create `.env` in project root:
```
DATABASE_URL="postgresql://...neon.../neondb?sslmode=require"
ADMIN_USER="The Chisp"
ADMIN_PASS="set-a-strong-password"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

## 3) Initialize Prisma
```bash
npx prisma migrate dev --name init
```

## 4) Run locally
```bash
npm run dev
```
- Open http://localhost:3000
- Admin: http://localhost:3000/admin (browser will prompt Basic Auth with ADMIN_USER / ADMIN_PASS)

## 5) Configure Vercel Blob
- In Vercel → Storage → Blob: create an RW token and paste into `BLOB_READ_WRITE_TOKEN` env var in your Vercel project.
- Images will be public at `https://...blob.vercel-storage.com/...` and are whitelisted in `next.config.mjs`.

## 6) Deploy to Vercel
- `vercel` (CLI) or push to GitHub and import the repo in Vercel.
- Set **Environment Variables** in Vercel Project Settings (same as `.env`).
- Add a domain later (e.g., budstagram.app) 

## 7) Use it
- Go to `/admin`, upload an image + caption → appears on `/`.
- Infinite load fetches older posts.

## Notes
- This is a minimal MVP. Next steps below.

## Roadmap (vNext)
- Post detail pages at `/p/[slug]` with OG image.
- Tags (walks, naps, chaos), search & filter.
- Real likes (anonymous session) and share.
- Captions: markdown + line breaks.
- Upload EXIF → capture taken at time.
- Admin: drafts, edit/delete, bulk upload.
- Image CDN params (auto-format, width variants).
- Sitemap/RSS.
- Optional Auth upgrade (Clerk/Auth.js) if you want multi-user later.
