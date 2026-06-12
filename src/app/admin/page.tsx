// src/app/admin/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import Link from "next/link";
import { Users, CalendarDays, BarChart2, Building2, ArrowRight, ShieldAlert } from "lucide-react";
import type { UserRole } from "@/lib/types/user";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Admin" };

async function getAdminSummary() {
  const [totalUsers, totalEvents, totalMedia, totalClubs, recentAuditLogs] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.media.count(),
      prisma.club.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          // no user relation directly – we use userId field
        },
      }),
    ]);

  return { totalUsers, totalEvents, totalMedia, totalClubs, recentAuditLogs };
}

const ADMIN_LINKS = [
  { label: "Manage Users", desc: "View, ban, and change roles", href: ROUTES.ADMIN_USERS, icon: Users, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  { label: "Manage Clubs", desc: "Create and edit clubs", href: ROUTES.ADMIN_CLUBS, icon: Building2, color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" },
  { label: "Analytics", desc: "Upload trends & growth", href: ROUTES.ADMIN_ANALYTICS, icon: BarChart2, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  { label: "All Events", desc: "Browse and moderate events", href: ROUTES.EVENTS, icon: CalendarDays, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  { label: "Content Moderation", desc: "Review AI-flagged media", href: "/admin/moderation", icon: ShieldAlert, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
];

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!hasRole(session.user.role as UserRole, "ADMIN")) redirect("/dashboard");

  const { totalUsers, totalEvents, totalMedia, totalClubs, recentAuditLogs } =
    await getAdminSummary();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-description">Platform overview and management</p>
      </div>

      {/* Stats */}
      <DashboardStats
        stats={[
          { label: "Active Users", value: totalUsers, icon: "users" },
          { label: "Published Events", value: totalEvents, icon: "calendar" },
          { label: "Total Media", value: totalMedia, icon: "image" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick links */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl card-hover"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${link.color}`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent audit log */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {recentAuditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
            ) : (
              recentAuditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <p className="text-xs font-medium text-foreground">{log.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.entityType} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
