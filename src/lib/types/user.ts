// src/lib/types/user.ts

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "PHOTOGRAPHER" | "CLUB_MEMBER" | "VIEWER";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    uploadedMedia: number;
    followers: number;
    following: number;
    likes: number;
  };
}

export interface UserProfile extends User {
  memberships: ClubMembership[];
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

export interface ClubMembership {
  clubId: string;
  club: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  role: UserRole;
  joinedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
}
