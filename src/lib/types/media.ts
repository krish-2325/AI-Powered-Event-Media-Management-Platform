// src/lib/types/media.ts

import type { AccessLevel } from "./event";
import type { User } from "./user";

export type MediaType = "IMAGE" | "VIDEO";

export interface Media {
  id: string;
  type: MediaType;
  title?: string | null;
  description?: string | null;
  s3Key: string;      // Stores Cloudinary publicId (field name kept for DB compat)
  s3Bucket: string;   // Stores "cloudinary" as provider
  originalUrl: string;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  fileSize: number;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  blurHash?: string | null;
  aiTags: string[];
  aiCaption?: string | null;
  accessLevel: AccessLevel;
  isWatermarked: boolean;
  uploaderId: string;
  eventId: string;
  albumId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaWithRelations extends Media {
  uploader: Pick<User, "id" | "name" | "username" | "avatarUrl">;
  _count: {
    likes: number;
    comments: number;
    shares: number;
    favorites: number;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface MediaTag {
  id: string;
  mediaId: string;
  taggedUserId: string;
  taggerUserId: string;
  x?: number | null;
  y?: number | null;
  taggedUser: Pick<User, "id" | "name" | "username" | "avatarUrl">;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  mediaId: string;
  parentId?: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: Pick<User, "id" | "name" | "username" | "avatarUrl">;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  mediaId?: string;
  error?: string;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  mediaId: string;
}
