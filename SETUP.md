# PixVault — Complete Setup Guide

Follow this guide after downloading the project. Takes about 20 minutes from zero to running.

---

## Prerequisites

| Tool | Required | Check |
|---|---|---|
| Node.js 18+ | ✅ Yes | `node --version` |
| npm 9+ | ✅ Yes | `npm --version` |
| Git | Recommended | `git --version` |
| Docker | Optional | `docker --version` |

---

## Step 1 — Unzip and open

```bash
unzip pixvault-v2.zip
cd pixvault
code .          # open in VS Code (or any editor)
```

---

## Step 2 — Install dependencies

```bash
npm install
```

Takes 2–4 minutes. Installs 55 production packages.

---

## Step 3 — Set up a free PostgreSQL database

**Option A — Neon.tech (recommended, no card needed)**
1. Go to [neon.tech](https://neon.tech) → Sign up free
2. Create new project → name it `pixvault`
3. Click **Connect** → copy the **Connection string** (starts with `postgresql://`)

**Option B — Local Docker**
```bash
docker-compose up -d db
# Your DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pixvault_dev
```

**Option C — Supabase**
1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → Connection string → copy URI

---

## Step 4 — Set up AWS (free for 12 months)

> **Free tier covers everything:** S3 (5 GB storage) + Rekognition (30,000 requests/month)

1. Go to [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free) → **Create Account**
   - Credit card required but **not charged** if you stay in free tier

2. **Create IAM User:**
   - Search `IAM` in AWS Console → Users → **Create user**
   - Name: `pixvault-dev`
   - Attach policies: `AmazonS3FullAccess` + `AmazonRekognitionFullAccess`
   - Security credentials → **Create access key** → save the **Key ID** and **Secret**

3. **Create S3 Bucket:**
   - Search `S3` → **Create bucket**
   - Name: `pixvault-media` (must be globally unique — add your name: `pixvault-media-yourname`)
   - Region: `ap-south-1` (Mumbai) — recommended for lowest latency from India
   - **Uncheck** "Block all public access" → Confirm → Create

4. **Enable CORS on your S3 bucket:**
   - Go to your bucket → Permissions → CORS → Edit → paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["http://localhost:3000", "https://your-vercel-domain.vercel.app"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

---

## Step 5 — Create environment file

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Database (from Step 3 — Neon.tech or Supabase)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run command below to generate>

# Cloudinary (from Step 4 — Dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

# Hugging Face (from Step 4b)
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Generate your NEXTAUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ Never commit `.env.local` to git — it's in `.gitignore`

---

## Step 6 — Set up the database

```bash
# 1. Generate Prisma client (reads schema, generates TypeScript types)
npm run db:generate

# 2. Create all database tables
npm run db:migrate

# 3. Seed demo data (creates test accounts + sample events)
npm run db:seed
```

After seeding, three accounts are ready:
```
Admin:        admin@pixvault.app        / Admin@1234   (Rahul Sharma)
Photographer: photographer@pixvault.app  / Photo@1234   (Arjun Mehta)
Member:       member@pixvault.app        / Member@1234  (Priya Patel)
```

---

## Step 7 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You'll see the PixVault landing page. Click **Sign In** → log in with the demo photographer account.

---

## Step 8 — Test core features

Once logged in, verify each feature:

| Feature | How to test |
|---|---|
| Upload photos | Dashboard → click an event → Upload tab → drag photos |
| AI tagging | After upload, wait 5–10 seconds → refresh → check tags on photo |
| Create event | Sidebar → Events → New Event |
| Face recognition | Profile → Settings → Face Recognition → upload selfie → visit `/my-photos` |
| Admin panel | Sign in as admin → Sidebar → Admin |
| QR sharing | Open any event → click QR/Share button |
| Stories | Events page (bar at top) |
| My Photos | Sidebar → My Photos |

---

## Optional — View the database visually

```bash
npm run db:studio
```

Opens Prisma Studio at [localhost:5555](http://localhost:5555) — browse all tables.

---

## Optional — Run tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (needs dev server in another terminal)
npm run test:e2e
```

---

## Deployment to Vercel (Free)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pixvault.git
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com) → New Project → Import your repo
   - **Build Command:** `npm run db:generate && next build`
   - **Environment Variables:** Add all keys from `.env.local`
   - Change `NEXTAUTH_URL` to your Vercel URL: `https://pixvault.vercel.app`
   - Click **Deploy**

3. **Run migrations on production:**
```bash
# Set DATABASE_URL to your production DB first
npx prisma migrate deploy
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## Deployment with Docker (Alternative)

```bash
# Build and run everything
docker-compose up --build

# Or just the database + redis
docker-compose up -d db redis

# Then run Next.js locally
npm run dev
```

---

## Common Issues & Fixes

| Problem | Fix |
|---|---|
| `PrismaClientKnownRequestError` | Run `npm run db:migrate` |
| `Invalid NEXTAUTH_SECRET` | Regenerate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Cloudinary upload fails | Check `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET` in `.env.local` |
| Cloudinary `Invalid signature` | Make sure `CLOUDINARY_API_SECRET` is correct (not the API key) |
| Hugging Face 503 error | Model is loading (cold start) — wait 30 seconds and retry |
| Hugging Face 401 error | Check `HUGGINGFACE_API_TOKEN` starts with `hf_` |
| NSFW.js slow on first run | Downloads model (~50 MB) on first use — subsequent runs are fast |
| `Module not found` error | Run `npm install` again |
| Fonts not loading | Normal on first load — Next.js downloads Google Fonts automatically |
| `prisma generate` fails | Delete `node_modules/.prisma` and run again |
| Image not showing after upload | Confirm Cloudinary cloud name is correct and bucket is set to public |

---

## Project Structure Quick Reference

```
pixvault/
├── src/app/              ← All pages and API routes
│   ├── api/              ← 26 REST API endpoints
│   ├── dashboard/        ← Main app dashboard
│   ├── events/           ← Event management
│   ├── gallery/          ← Media gallery
│   ├── my-photos/        ← Face recognition results
│   └── admin/            ← Admin panel + moderation
├── src/components/       ← 35+ React components
├── src/lib/              ← Business logic, AI, storage, auth
├── src/store/            ← Zustand state stores
├── prisma/               ← Database schema + seed
├── tests/                ← Unit, integration, E2E tests
├── docs/                 ← Architecture + API + Feature docs
├── .github/workflows/    ← CI/CD pipeline
├── Dockerfile            ← Docker build
└── docker-compose.yml    ← Full stack local environment
```

---

## What to Submit

| Deliverable | Where |
|---|---|
| ✅ Working codebase | This project folder |
| ✅ README | `/README.md` |
| ✅ DB Schema | `/prisma/schema.prisma` |
| ✅ Architecture Diagram | `/docs/ARCHITECTURE.md` |
| ✅ API Documentation | `/docs/API.md` |
| ✅ Feature List | `/docs/FEATURES.md` |
| ✅ CI/CD Pipeline | `/.github/workflows/ci.yml` |
| ✅ Docker setup | `/Dockerfile` + `/docker-compose.yml` |
| ⚠️ PPT/Slides | Create using `/docs/FEATURES.md` + `/docs/ARCHITECTURE.md` |
| ⚠️ Demo Video | Record screen after running the app |

---

## Demo Video Script (3–5 minutes)

1. **Landing page** (0:00–0:20) — show the homepage, features listed
2. **Login** (0:20–0:40) — sign in as photographer
3. **Dashboard** (0:40–1:00) — show stats, recent events (Diwali Walk, Techfest, Ladakh Trip), recent uploads
4. **Create event** (1:00–1:30) — create a "Holi Celebration – NSUT Campus" event
5. **Upload photos** (1:30–2:15) — drag photos from a college event, show the thumbnail preview grid before upload, watch progress
6. **AI features** (2:15–2:45) — refresh, show AI tags on photos, open My Photos
7. **Social features** (2:45–3:15) — like, comment, tag a friend, share
8. **Admin panel** (3:15–3:45) — sign in as admin, show user management + moderation queue
9. **QR sharing + Stories** (3:45–4:15) — show QR modal, story bubble bar
10. **Wrap up** (4:15–4:30) — show architecture diagram, mention free tier
