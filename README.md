# PixVault 📸

**Enterprise Event & Media Management Platform for Clubs and Organizations**

PixVault is a full-stack Next.js application that enables clubs and student organizations to upload, manage, tag, and share event photos and videos — with AI-powered smart tagging and face recognition to help every member find their own photos instantly.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Bulk Media Upload** | Drag-and-drop up to 50 files at once with real-time progress tracking |
| **AI Image Tagging** | Hugging Face AI auto-tags every photo with scenes, objects, and activities |
| **Face Recognition** | Members upload a selfie; PixVault finds all their photos across events |
| **Masonry / Grid / List Gallery** | Multiple view modes with infinite scroll |
| **Lightbox Viewer** | Zoom, download, captions, and thumbnail strip |
| **Event & Album Management** | Organized hierarchy: Club → Event → Album → Media |
| **Role-Based Access Control** | Super Admin / Admin / Photographer / Club Member / Viewer |
| **Access Levels** | Public, Members-Only, Private per event and per media |
| **Social Features** | Likes, comments (threaded), favorites, follows, shares |
| **Real-time Notifications** | Like, comment, tag, follow, upload alerts |
| **Full-Text Search** | Events, photos (by AI tag), and people |
| **Dark / Light / System Theme** | Persisted per-user preference |
| **Analytics Dashboard** | Upload trends, user growth, engagement stats |
| **Audit Log** | Every sensitive action recorded for admins |
| **S3-compatible Storage** | Direct client-side uploads via presigned URLs |
| **QR Code Sharing** | Per-event QR codes for easy access sharing |
| **PWA Ready** | Works offline, installable on mobile |

---

## 🏗️ Architecture

```
pixvault/
├── src/
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── api/                  # REST API (auth, events, media, users, ai, notifications)
│   │   ├── auth/                 # Login, Register, Forgot Password pages
│   │   ├── dashboard/            # Main authenticated dashboard
│   │   ├── events/               # Event listing, create, detail pages
│   │   ├── gallery/              # Global media gallery with filters
│   │   ├── media/                # Single media detail with comments
│   │   ├── profile/              # User profiles and settings
│   │   ├── search/               # Full-text search across entities
│   │   ├── notifications/        # Notification centre
│   │   └── admin/                # Admin panel: users, clubs, analytics
│   │
│   ├── components/               # Reusable React components
│   │   ├── ui/                   # Design system primitives (Button, Badge, Avatar, etc.)
│   │   ├── layout/               # Sidebar, Header, Providers
│   │   ├── media/                # MediaCard, MediaGallery, MediaUploader, Lightbox
│   │   ├── events/               # EventCard, EventFilters, CreateEventForm
│   │   ├── social/               # CommentSection, NotificationList
│   │   ├── ai/                   # FaceSelfieUpload
│   │   └── admin/                # DashboardStats, AnalyticsCharts
│   │
│   ├── lib/
│   │   ├── api/          client.ts    # Type-safe API client
│   │   ├── ai/           image-tagging.ts  # Hugging Face AI integration
│   │   ├── auth/         auth-options.ts, helpers.ts
│   │   ├── db/           prisma.ts    # Singleton Prisma client
│   │   ├── storage/      s3.ts, image-processor.ts
│   │   ├── hooks/        use-upload, use-debounce, use-intersection-observer, …
│   │   ├── types/        user, event, media, api, notifications
│   │   ├── validations/  Zod schemas (shared between client & server)
│   │   └── constants/    routes, labels, limits
│   │
│   └── store/            Zustand stores: auth, upload, notifications, ui
│
├── prisma/
│   ├── schema.prisma     Full relational schema (User, Event, Media, Club, …)
│   └── seed.ts           Demo data seeder
│
├── tests/
│   ├── unit/             Jest unit tests (utils, auth, validations)
│   ├── integration/      API route integration tests
│   └── e2e/              Playwright end-to-end tests
│
└── .github/workflows/    CI pipeline (lint, type-check, test, build, deploy)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- AWS account (S3 + Rekognition)

### 1. Clone & install

```bash
git clone https://github.com/your-org/pixvault.git
cd pixvault
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in all required values
```

### 3. Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo accounts (after seeding):**
- Admin: `admin@pixvault.app` / `Admin@1234`
- Photographer: `photographer@pixvault.app` / `Photo@1234`

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires dev server running)
npm run test:e2e
```

---

## 🔧 Key Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript type check |
| `npm run format` | Prettier format |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run new migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed demo data |
| `npm run analyze` | Bundle size analysis |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Components) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS + custom design system |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | NextAuth.js (Credentials + Google + GitHub) |
| **Storage** | Cloudinary with CloudFront CDN |
| **AI** | Hugging Face AI (labels + face) |
| **Image Processing** | Sharp (thumbnails, WebP, BlurHash) |
| **State** | Zustand + TanStack Query |
| **Forms** | React Hook Form + Zod |
| **Animations** | Framer Motion |
| **Queue** | BullMQ + Redis |
| **Testing** | Jest + Playwright |
| **CI/CD** | GitHub Actions |

---

## 📦 Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Set environment variables in the Vercel dashboard
3. Add build command: `npm run db:generate && next build`
4. Deploy!

### Docker / Railway / Render
A `Dockerfile` can be added. The app needs:
- Node.js 18 runtime
- PostgreSQL connection
- Redis connection
- AWS credentials

---

## 🔐 Security

- CSRF protection via NextAuth
- HTTP security headers (X-Frame-Options, CSP, etc.)
- Rate limiting on API routes
- Input validation with Zod on every endpoint
- Role-based access control (5 levels)
- Per-media access levels (Public / Members-Only / Private)
- Audit log for all sensitive actions
- S3 objects accessed only via presigned URLs

---

## 📄 License
Krish Goyal
