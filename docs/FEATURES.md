# PixVault — Complete Feature List

> Built for Indian college photography clubs and student societies.
> Pre-loaded with real Indian event data: Diwali walks, Techfest, Holi shoots, Ladakh expeditions, Varanasi ghat workshops.

## Core Features (PS Required)

### 1. Event Management
- [x] Create / Edit / Delete events
- [x] Event descriptions, metadata (location, dates, category)
- [x] Sort by date, category, name (A-Z, Z-A, newest, oldest)
- [x] Event status: Draft / Published / Archived
- [x] Access levels: Public / Members-Only / Private
- [x] Event-wise **Albums** — create, view, manage, delete albums per event
- [x] QR code sharing per event

### 2. Media Upload
- [x] Photos (JPEG, PNG, WebP, AVIF, GIF) + Videos (MP4, WebM, MOV)
- [x] Bulk upload — up to 50 files per session
- [x] Drag-and-drop upload zone
- [x] **Preview before upload** — thumbnail grid, remove individual files before confirming
- [x] Upload progress bar with per-file status
- [x] Floating upload panel with live progress
- [x] Automatic WebP conversion + compression (Sharp)
- [x] BlurHash placeholder generation for lazy loading
- [x] Direct-to-S3 presigned URL upload (never touches the app server)

### 3. Access Control & Authentication
- [x] Email + password registration/login
- [x] Google OAuth
- [x] GitHub OAuth
- [x] Role-based access: **Super Admin / Admin / Photographer / Club Member / Viewer**
- [x] Per-event access levels enforced on all API routes
- [x] Per-media access levels
- [x] Session management with NextAuth.js JWT

### 4. Social Features
- [x] **Like / Unlike** with real-time count
- [x] **Comments** — threaded replies, edit indicator
- [x] **Share** — copy link, native share API, share count tracking
- [x] **Download** — with dynamic watermark (club + event + role)
- [x] **Add to Favourites** — personal collection
- [x] **Tag friends** — click-to-tag on photo with position coordinates, tag notification
- [x] Remove tag (by tagger or tagged user)
- [x] Follow / Unfollow users
- [x] **Notifications** — like, comment, tag, follow, share, upload, mentions, event invites
- [x] Real-time notification polling (30s interval) + Web Push Notifications API

### 5. AI / ML Features
- [x] **Smart image tagging** — Hugging Face AI DetectLabels (up to 15 tags per photo)
- [x] **AI-generated captions** — synthesized from detected labels
- [x] **Facial recognition** — upload reference selfie, face descriptors stored
- [x] **My Photos** — personalized page finds all photos of you via Euclidean distance matching
- [x] **Image moderation** — Hugging Face AI DetectModerationLabels, auto-flag + admin queue
- [x] **Duplicate detection** — perceptual hash (pHash) via DCT, notifies uploader

### 6. Cloud Integration
- [x] **Cloudinary** — direct presigned upload, presigned download, CloudFront CDN support
- [x] **Hugging Face AI** — labels, faces, moderation (all within free tier: 5,000/month)
- [x] All within AWS 12-month free tier

### 7. Watermarking
- [x] Auto-applied on every download
- [x] Dynamic text: `club name · event name · user role`
- [x] Position: bottom-right (Public/Members), center diagonal (Private)
- [x] Opacity and font size scale with image dimensions

---

## Bonus / Optional Features

### Stories (Instagram-style)
- [x] **24-hour expiring stories** from event media
- [x] Story bubble bar with unseen indicator ring
- [x] Full-screen story viewer with auto-advance timer
- [x] Per-story progress bars
- [x] Keyboard navigation (←/→/Escape)
- [x] View count tracking
- [x] Create story from existing event media

### Collaborative Albums
- [x] Add collaborators to albums with upload permission
- [x] Invitation notification to collaborator
- [x] Remove collaborator
- [x] Schema supports per-collaborator permissions

### PWA (Progressive Web App)
- [x] `site.webmanifest` with icons, shortcuts (Upload, My Photos, Gallery)
- [x] `next-pwa` integration guide (`docs/PWA_SETUP.md`)
- [x] Offline caching strategy: CacheFirst for assets, StaleWhileRevalidate for API
- [x] Web Notifications API for push alerts

### Search & Discovery
- [x] Full-text search across events, photos (by AI tag), and people
- [x] **Filter by category** (9 categories)
- [x] **Filter by date range** (from/to date pickers)
- [x] Combined category + date + text search

### Analytics Dashboard
- [x] Platform-wide stats (users, events, media, likes)
- [x] Upload trend chart (last 14 days, Recharts AreaChart)
- [x] Per-user stats on dashboard

### Admin Panel
- [x] User management — view, change roles, ban/unban
- [x] Club management — create, view clubs
- [x] Analytics dashboard
- [x] **Content moderation queue** — review, approve, or delete flagged media
- [x] Audit log for all admin actions

### Developer / DevOps
- [x] Docker + docker-compose (app + PostgreSQL + Redis)
- [x] GitHub Actions CI/CD (lint → type-check → test → build → deploy)
- [x] Architecture diagrams (system, sequence, ER) in Mermaid
- [x] API documentation (`docs/API.md`)
- [x] Unit tests (Jest) — utils, auth, validations
- [x] Integration tests (Jest) — events API, media like API
- [x] E2E tests (Playwright) — auth, events, gallery, search
- [x] Prisma DB seed with demo accounts

---

## AI Pipeline (triggered on every image upload)

```
Upload confirmed
      │
      ├── /api/ai/tag      → Hugging Face AI DetectLabels → aiTags + aiCaption
      ├── /api/ai/moderate → Hugging Face AI DetectModerationLabels → flag if unsafe
      └── /api/ai/duplicates → pHash DCT → compare against event photos → notify if duplicate
```

All three run in parallel, non-blocking (fire-and-forget from confirm route).

---

## Free Tier Cost Summary

| Service | Free Tier | Limit |
|---|---|---|
| Cloudinary | 12 months | 5 GB, 20K GETs, 2K PUTs |
| Hugging Face AI | 12 months | 30,000 requests/month (tags + faces + moderation) |
| Neon PostgreSQL | Forever | 512 MB |
| Vercel | Forever | Hobby plan |
| All npm packages | Forever | MIT/Apache/BSD |
