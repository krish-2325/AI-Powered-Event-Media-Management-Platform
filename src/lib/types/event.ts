// src/lib/types/event.ts

export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EventCategory =
  | "PHOTOSHOOT"
  | "WORKSHOP"
  | "TRIP"
  | "COMPETITION"
  | "CULTURAL_FEST"
  | "PARTY"
  | "SEMINAR"
  | "SPORTS"
  | "OTHER";
export type AccessLevel = "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverUrl?: string | null;
  category: EventCategory;
  status: EventStatus;
  accessLevel: AccessLevel;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  ownerId: string;
  clubId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
  club?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
  _count?: {
    media: number;
    albums: number;
  };
}

export interface EventWithAlbums extends Event {
  albums: Album[];
}

export interface Album {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  accessLevel: AccessLevel;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    media: number;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  accessLevel: AccessLevel;
  location?: string;
  startDate?: string;
  endDate?: string;
  clubId?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}
