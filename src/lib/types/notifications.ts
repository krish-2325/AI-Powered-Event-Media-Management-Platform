// src/lib/types/notifications.ts

import type { User } from "./user";

export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "TAG"
  | "FOLLOW"
  | "SHARE"
  | "UPLOAD"
  | "MENTION"
  | "EVENT_INVITE"
  | "SYSTEM";

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  senderId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
  sender?: Pick<User, "id" | "name" | "username" | "avatarUrl"> | null;
}
