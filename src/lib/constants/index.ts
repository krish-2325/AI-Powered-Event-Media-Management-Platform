// src/lib/constants/index.ts

export const APP_NAME = "PixVault";
export const APP_DESCRIPTION =
  "Centralized Event & Media Management Platform for clubs and organizations";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const GALLERY_PAGE_SIZE = 30;

// Upload limits
export const MAX_UPLOAD_BATCH = 50; // files per upload
export const MAX_IMAGE_SIZE_MB = 20;
export const MAX_VIDEO_SIZE_MB = 500;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Event categories display labels
export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  PHOTOSHOOT: "Photoshoot",
  WORKSHOP: "Workshop",
  TRIP: "Expedition / Trip",
  COMPETITION: "Techfest / Competition",
  CULTURAL_FEST: "Cultural Fest",
  PARTY: "Farewell / Party",
  SEMINAR: "Seminar / Talk",
  SPORTS: "Sports Meet",
  OTHER: "Other",
};

export const EVENT_CATEGORY_ICONS: Record<string, string> = {
  PHOTOSHOOT: "📸",
  WORKSHOP: "🛠️",
  TRIP: "🏔️",
  COMPETITION: "🏆",
  CULTURAL_FEST: "🎭",
  PARTY: "🎊",
  SEMINAR: "🎓",
  SPORTS: "🏏",
  OTHER: "📌",
};

// Access level labels
export const ACCESS_LEVEL_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members Only",
  PRIVATE: "Private",
};

// User role display labels
export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PHOTOGRAPHER: "Photographer",
  CLUB_MEMBER: "Club Member",
  VIEWER: "Viewer",
};

// Notification type icons
export const NOTIFICATION_ICONS: Record<string, string> = {
  LIKE: "❤️",
  COMMENT: "💬",
  TAG: "🏷️",
  FOLLOW: "👤",
  SHARE: "🔗",
  UPLOAD: "📤",
  MENTION: "@",
  EVENT_INVITE: "📅",
  SYSTEM: "🔔",
};

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  DASHBOARD: "/dashboard",
  EVENTS: "/events",
  CREATE_EVENT: "/events/create",
  EVENT: (slug: string) => `/events/${slug}`,
  EVENT_MEDIA: (slug: string) => `/events/${slug}/media`,
  GALLERY: "/gallery",
  PROFILE: (username: string) => `/profile/${username}`,
  PROFILE_SETTINGS: "/profile/settings",
  NOTIFICATIONS: "/notifications",
  SEARCH: "/search",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_CLUBS: "/admin/clubs",
  ADMIN_ANALYTICS: "/admin/analytics",
  MY_PHOTOS: "/my-photos",
  ADMIN_MODERATION: "/admin/moderation",
} as const;

// API routes
export const API_ROUTES = {
  AUTH: "/api/auth",
  EVENTS: "/api/events",
  MEDIA: "/api/media",
  USERS: "/api/users",
  NOTIFICATIONS: "/api/notifications",
  AI_TAG: "/api/ai/tag",
  AI_FACE: "/api/ai/face",
  UPLOAD_PRESIGN: "/api/media/presign",
  SEARCH: "/api/search",
} as const;
