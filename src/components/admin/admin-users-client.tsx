// src/components/admin/admin-users-client.tsx
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Shield, Ban, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { USER_ROLE_LABELS, ROUTES } from "@/lib/constants";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "@/lib/hooks/use-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  avatarUrl?: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  _count: { uploadedMedia: number; ownedEvents: number };
}

interface AdminUsersClientProps {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  query?: string;
}

const ROLE_OPTIONS = [
  "VIEWER",
  "CLUB_MEMBER",
  "PHOTOGRAPHER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export function AdminUsersClient({
  users,
  total,
  page,
  totalPages,
  query,
}: AdminUsersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(query ?? "");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  // Navigate when debounced search changes
  const handleSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  // Trigger search on debounce
  useState(() => {
    if (debouncedSearch !== (query ?? "")) {
      handleSearch(debouncedSearch);
    }
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast({ title: "Role updated", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Failed to update role", variant: "error" });
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    setLoadingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({
        title: isBanned ? "User unbanned" : "User banned",
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({ title: "Action failed", variant: "error" });
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, username…"
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Activity
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "hover:bg-secondary/30 transition-colors",
                      user.isBanned && "opacity-60"
                    )}
                  >
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold text-primary">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={ROUTES.PROFILE(user.username)}
                            className="font-medium text-foreground hover:text-primary truncate block"
                          >
                            {user.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={loadingUserId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {USER_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Activity */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>{formatNumber(user._count.uploadedMedia)} photos</p>
                        <p>{formatNumber(user._count.ownedEvents)} events</p>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <span className="badge-archived">Banned</span>
                      ) : user.isActive ? (
                        <span className="badge-published">Active</span>
                      ) : (
                        <span className="badge-draft">Inactive</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleBan(user.id, user.isBanned)}
                          disabled={loadingUserId === user.id}
                          title={user.isBanned ? "Unban user" : "Ban user"}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                            user.isBanned
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              : "text-destructive hover:bg-destructive/10",
                            "disabled:opacity-50"
                          )}
                        >
                          {user.isBanned ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} users
            </p>
            <div className="flex gap-1">
              <Link
                href={`${pathname}?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(Math.max(1, page - 1)) })}`}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors",
                  page <= 1
                    ? "text-muted-foreground/40 pointer-events-none"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={`${pathname}?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(Math.min(totalPages, page + 1)) })}`}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors",
                  page >= totalPages
                    ? "text-muted-foreground/40 pointer-events-none"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
