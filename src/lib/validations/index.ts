// src/lib/validations/index.ts
// Shared Zod schemas for form validation and API request validation

import { z } from "zod";

// ── Auth ──────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Events ────────────────────────────────────────────

export const eventCategories = [
  "PHOTOSHOOT",
  "WORKSHOP",
  "TRIP",
  "COMPETITION",
  "CULTURAL_FEST",
  "PARTY",
  "SEMINAR",
  "SPORTS",
  "OTHER",
] as const;

export const accessLevels = ["PUBLIC", "MEMBERS_ONLY", "PRIVATE"] as const;

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(2000).optional(),
  category: z.enum(eventCategories),
  accessLevel: z.enum(accessLevels),
  location: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clubId: z.string().cuid().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// ── Albums ────────────────────────────────────────────

export const createAlbumSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  accessLevel: z.enum(accessLevels),
  eventId: z.string().cuid(),
});

// ── Media ─────────────────────────────────────────────

export const uploadMediaSchema = z.object({
  eventId: z.string().cuid(),
  albumId: z.string().cuid().optional(),
  files: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
    })
  ).min(1).max(50, "Maximum 50 files per upload"),
});

// ── Comments ──────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000, "Comment too long"),
  mediaId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
});

// ── Profile ───────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

// ── Search ────────────────────────────────────────────

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  category: z.enum(eventCategories).optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "likes", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
