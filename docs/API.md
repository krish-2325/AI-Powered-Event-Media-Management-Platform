# PixVault API Documentation

Base URL: `https://your-domain.com/api`

All endpoints return JSON in the shape:
```json
{ "success": true, "data": { ... } }
// or
{ "success": false, "error": "message", "errors": { "field": ["msg"] } }
```

---

## Authentication

PixVault uses NextAuth.js with JWT sessions. Authenticated requests require a valid session cookie (set automatically by the browser after sign-in).

### POST /api/auth/register
Register a new account.

**Body:**
```json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "Password1",
  "confirmPassword": "Password1"
}
```

**Response 201:**
```json
{ "success": true, "data": { "id": "...", "email": "...", "username": "..." } }
```

### POST /api/auth/[...nextauth]
NextAuth.js handler — handles sign-in, sign-out, and OAuth callbacks.

---

## Events

### GET /api/events
List published events with pagination and filtering.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| category | string | — | Filter by category (PHOTOSHOOT, WORKSHOP, etc.) |
| q | string | — | Full-text search |
| sortBy | string | createdAt | Field to sort by |
| sortOrder | asc\|desc | desc | Sort direction |
| clubId | string | — | Filter by club |
| ownerId | string | — | Filter by owner |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "events": [ { "id": "...", "title": "...", "slug": "...", ... } ],
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3, "hasNextPage": true }
  }
}
```

### POST /api/events
Create a new event. Requires CLUB_MEMBER role or above.

**Body:**
```json
{
  "title": "Photography Workshop 2024",
  "description": "Optional description",
  "category": "WORKSHOP",
  "accessLevel": "PUBLIC",
  "location": "Mumbai",
  "startDate": "2024-12-01T10:00:00.000Z",
  "endDate": "2024-12-01T18:00:00.000Z",
  "clubId": "optional-club-id"
}
```

**Response 201:** Returns the created event object.

### GET /api/events/:eventId
Get a single event by ID or slug.

### PATCH /api/events/:eventId
Update event. Owner or ADMIN only.

**Body:** Any subset of create fields plus `status: "DRAFT" | "PUBLISHED" | "ARCHIVED"`.

### DELETE /api/events/:eventId
Delete event and all its media (including S3 objects). Owner or ADMIN only.

---

## Media

### GET /api/media
List media with filters.

**Query params:** `eventId`, `albumId`, `uploaderId`, `type` (IMAGE|VIDEO), `tags` (comma-separated), `q`, `page`, `limit`

### POST /api/media/presign
Get Cloudinary signed upload params for direct client upload. Returns one set of params per file.

**Body:**
```json
{
  "eventId": "...",
  "albumId": "optional",
  "files": [
    { "name": "photo.jpg", "type": "image/jpeg", "size": 1024000 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "mediaId": "...", "uploadUrl": "https://api.cloudinary.com/v1_1/your-cloud/auto/upload", "publicId": "media/abc123" }
  ]
}
```

### POST /api/media/:mediaId/confirm
Mark upload as complete; triggers AI tagging job.

### GET /api/media/:mediaId/download
Returns a Cloudinary CDN URL with dynamic watermark applied (club · event · role). The watermark is rendered by Cloudinary at CDN level.

### POST /api/media/:mediaId/like
Toggle like on a media item.

**Response:**
```json
{ "success": true, "data": { "liked": true, "count": 42 } }
```

### POST /api/media/:mediaId/favorite
Toggle favorite.

### POST /api/media/:mediaId/share
Record a share event and return shareable URL.

**Body:** `{ "platform": "link" | "whatsapp" | "twitter" }` (optional)

### GET /api/media/:mediaId/comments
Get all comments (with nested replies).

### POST /api/media/:mediaId/comments
Add a comment.

**Body:** `{ "content": "Great shot!", "parentId": "optional-parent-id" }`

---

## Users

### GET /api/users/me
Get current authenticated user profile.

### PATCH /api/users/me
Update profile fields.

**Body:** `{ "name": "...", "username": "...", "bio": "..." }`

### POST /api/users/me/face
Upload reference selfie for face recognition. Accepts `multipart/form-data` with field `selfie`.

---

## Notifications

### GET /api/notifications
Get notification feed for the current user.

**Query:** `limit` (default 50), `unreadOnly=true`

### POST /api/notifications/read-all
Mark all notifications as read.

### GET /api/notifications/unread-count
Returns `{ "count": 5 }`.

---

## AI

### POST /api/ai/tag
Trigger AI tagging for a media item. PHOTOGRAPHER role or above.

**Body:** `{ "mediaId": "..." }`

---

## Admin

### PATCH /api/admin/users/:userId
Update user role or ban status. ADMIN role required.

**Body:** `{ "role": "CLUB_MEMBER", "isBanned": false }`

### POST /api/admin/clubs
Create a new club.

**Body:** `{ "name": "Photography Club", "description": "Optional" }`

---

## Error Codes

| HTTP | Meaning |
|---|---|
| 400 | Validation failed — check `errors` field |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/username/slug) |
| 500 | Internal server error |
