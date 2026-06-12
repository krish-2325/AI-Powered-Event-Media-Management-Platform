// src/lib/api/client.ts
// Type-safe API client wrappers for use in client components

import type { ApiResponse, PaginatedResponse, SearchParams } from "@/lib/types/api";
import type { Event, CreateEventInput, UpdateEventInput } from "@/lib/types/event";
import type { MediaWithRelations, Comment } from "@/lib/types/media";
import type { User, UserProfile } from "@/lib/types/user";

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? "Request failed");
  }

  return json;
}

// ─────────────────────────────────────────────
// Events API
// ─────────────────────────────────────────────
export const eventsApi = {
  list: async (params?: SearchParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ events: Event[]; pagination: any }>(`/api/events?${query}`);
  },

  get: async (slugOrId: string) =>
    apiFetch<Event>(`/api/events/${slugOrId}`),

  create: async (data: CreateEventInput) =>
    apiFetch<Event>("/api/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id: string, data: UpdateEventInput) =>
    apiFetch<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: async (id: string) =>
    apiFetch(`/api/events/${id}`, { method: "DELETE" }),

  publish: async (id: string) =>
    apiFetch<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PUBLISHED" }),
    }),

  archive: async (id: string) =>
    apiFetch<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ARCHIVED" }),
    }),
};

// ─────────────────────────────────────────────
// Media API
// ─────────────────────────────────────────────
export const mediaApi = {
  list: async (params?: SearchParams & { eventId?: string; albumId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ media: MediaWithRelations[]; pagination: any }>(
      `/api/media?${query}`
    );
  },

  get: async (id: string) => apiFetch<MediaWithRelations>(`/api/media/${id}`),

  like: async (id: string) =>
    apiFetch<{ liked: boolean; count: number }>(`/api/media/${id}/like`, {
      method: "POST",
    }),

  favorite: async (id: string) =>
    apiFetch<{ favorited: boolean }>(`/api/media/${id}/favorite`, {
      method: "POST",
    }),

  delete: async (id: string) =>
    apiFetch(`/api/media/${id}`, { method: "DELETE" }),

  getComments: async (id: string) =>
    apiFetch<Comment[]>(`/api/media/${id}/comments`),

  addComment: async (mediaId: string, content: string, parentId?: string) =>
    apiFetch<Comment>(`/api/media/${mediaId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, mediaId, parentId }),
    }),

  deleteComment: async (mediaId: string, commentId: string) =>
    apiFetch(`/api/media/${mediaId}/comments/${commentId}`, { method: "DELETE" }),

  getDownloadUrl: async (id: string) =>
    apiFetch<{ url: string }>(`/api/media/${id}/download`),

  tagUser: async (
    mediaId: string,
    taggedUserId: string,
    position?: { x: number; y: number }
  ) =>
    apiFetch(`/api/media/${mediaId}/tags`, {
      method: "POST",
      body: JSON.stringify({ taggedUserId, ...position }),
    }),
};

// ─────────────────────────────────────────────
// Users API
// ─────────────────────────────────────────────
export const usersApi = {
  getProfile: async (username: string) =>
    apiFetch<UserProfile>(`/api/users/${username}`),

  updateProfile: async (data: Partial<User>) =>
    apiFetch<User>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  follow: async (userId: string) =>
    apiFetch<{ following: boolean }>(`/api/users/${userId}/follow`, {
      method: "POST",
    }),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch("/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  findMyPhotos: async () =>
    apiFetch<MediaWithRelations[]>("/api/users/me/photos"),

  uploadFaceSelfie: async (file: File) => {
    const formData = new FormData();
    formData.append("selfie", file);
    const res = await fetch("/api/users/me/face", {
      method: "POST",
      body: formData,
    });
    return res.json();
  },
};

// ─────────────────────────────────────────────
// Notifications API
// ─────────────────────────────────────────────
export const notificationsApi = {
  list: async () => apiFetch("/api/notifications"),

  markRead: async (id: string) =>
    apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),

  markAllRead: async () =>
    apiFetch("/api/notifications/read-all", { method: "POST" }),

  getUnreadCount: async () =>
    apiFetch<{ count: number }>("/api/notifications/unread-count"),
};
