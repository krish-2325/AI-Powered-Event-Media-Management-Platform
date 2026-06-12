// tests/unit/auth.test.ts

import { hasRole, canAccessContent } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

describe("hasRole", () => {
  const hierarchy: UserRole[] = [
    "VIEWER",
    "CLUB_MEMBER",
    "PHOTOGRAPHER",
    "ADMIN",
    "SUPER_ADMIN",
  ];

  it("allows equal role", () => {
    hierarchy.forEach((role) => expect(hasRole(role, role)).toBe(true));
  });

  it("allows higher role", () => {
    expect(hasRole("ADMIN", "VIEWER")).toBe(true);
    expect(hasRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("PHOTOGRAPHER", "CLUB_MEMBER")).toBe(true);
  });

  it("blocks lower role", () => {
    expect(hasRole("VIEWER", "CLUB_MEMBER")).toBe(false);
    expect(hasRole("CLUB_MEMBER", "ADMIN")).toBe(false);
    expect(hasRole("PHOTOGRAPHER", "ADMIN")).toBe(false);
  });
});

describe("canAccessContent", () => {
  it("allows PUBLIC content to anyone", () => {
    expect(canAccessContent(undefined, "PUBLIC")).toBe(true);
    expect(canAccessContent("VIEWER", "PUBLIC")).toBe(true);
    expect(canAccessContent("SUPER_ADMIN", "PUBLIC")).toBe(true);
  });

  it("blocks MEMBERS_ONLY from unauthenticated", () => {
    expect(canAccessContent(undefined, "MEMBERS_ONLY")).toBe(false);
  });

  it("blocks MEMBERS_ONLY from VIEWER", () => {
    expect(canAccessContent("VIEWER", "MEMBERS_ONLY")).toBe(false);
  });

  it("allows MEMBERS_ONLY to CLUB_MEMBER and above", () => {
    expect(canAccessContent("CLUB_MEMBER", "MEMBERS_ONLY")).toBe(true);
    expect(canAccessContent("PHOTOGRAPHER", "MEMBERS_ONLY")).toBe(true);
    expect(canAccessContent("ADMIN", "MEMBERS_ONLY")).toBe(true);
  });

  it("blocks PRIVATE from non-admins", () => {
    expect(canAccessContent("CLUB_MEMBER", "PRIVATE")).toBe(false);
    expect(canAccessContent("PHOTOGRAPHER", "PRIVATE")).toBe(false);
  });

  it("allows PRIVATE to ADMIN and above", () => {
    expect(canAccessContent("ADMIN", "PRIVATE")).toBe(true);
    expect(canAccessContent("SUPER_ADMIN", "PRIVATE")).toBe(true);
  });

  it("allows owner to access any level", () => {
    expect(canAccessContent(undefined, "PRIVATE", true)).toBe(true);
    expect(canAccessContent("VIEWER", "PRIVATE", true)).toBe(true);
    expect(canAccessContent("VIEWER", "MEMBERS_ONLY", true)).toBe(true);
  });
});
