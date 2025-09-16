# Budstagram – MVP

Instagram-style feed for Bud with a private admin uploader.

## 0) Prereqs
- Node 18+
- Vercel account
- Neon (Postgres) account (free tier)

## 1) Clone & install
```bash
npm i

## 2) Create Postgres (Neon)
Create a new project (Postgres 15) and copy the full connection string.

Create .env in project root:

ini
Copy code
DATABASE_URL="your-neon-connection-string"
ADMIN_USER="your-admin-username"
ADMIN_PASS="your-admin-password"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

## 3) Initialize Prisma
bash
Copy code
npx prisma migrate dev --name init

## 4) Run locally
bash
Copy code
npm run dev
Open http://localhost:3000

Admin: http://localhost:3000/admin (browser will prompt Basic Auth using ADMIN_USER / ADMIN_PASS)

## 5) Configure Vercel Blob
In Vercel → Storage → Blob: create a read/write token and set it as BLOB_READ_WRITE_TOKEN in your Vercel project.

Images will be hosted at https://...blob.vercel-storage.com/... (already whitelisted in next.config.mjs).

## 6) Deploy to Vercel
Use vercel (CLI) or push to GitHub and import the repo into Vercel.

Set Environment Variables in Vercel Project Settings (same as your .env).

Add a custom domain later (e.g. budstagram.app).

## 7) Use it
Go to /admin, upload an image + caption → appears on /.

Infinite scroll fetches older posts.
