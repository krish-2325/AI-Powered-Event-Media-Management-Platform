// src/lib/auth/helpers.ts

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth-options";
import type { UserRole } from "@/lib/types/user";

/**
 * Get the current session user (server component)
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get session and redirect to login if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session;
}

/**
 * Get session and redirect if user doesn't have required role
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  CLUB_MEMBER: 1,
  PHOTOGRAPHER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Check if a role has at least the required level
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a user can access content with given access level
 */
export function canAccessContent(
  userRole: UserRole | undefined,
  accessLevel: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE",
  isOwner = false
): boolean {
  if (isOwner) return true;
  if (accessLevel === "PUBLIC") return true;
  if (!userRole) return false;
  if (accessLevel === "MEMBERS_ONLY") {
    return hasRole(userRole, "CLUB_MEMBER");
  }
  // PRIVATE: only admins or owner
  return hasRole(userRole, "ADMIN");
}
