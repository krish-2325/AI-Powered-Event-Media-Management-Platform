// src/app/admin/analytics/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Analytics | Admin" };

async function getAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalEvents,
    totalMedia,
    totalLikes,
    newUsersThisMonth,
    newMediaThisMonth,
    recentUploads,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.media.count(),
    prisma.like.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.media.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    // Uploads per day last 14 days
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE("createdAt")::text as date,
        COUNT(*)::bigint as count
      FROM media
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  return {
    totalUsers,
    totalEvents,
    totalMedia,
    totalLikes,
    newUsersThisMonth,
    newMediaThisMonth,
    recentUploads: recentUploads.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
  };
}

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!hasRole(session.user.role as UserRole, "ADMIN")) redirect("/dashboard");

  const analytics = await getAnalytics();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-description">Platform-wide statistics and insights</p>
      </div>

      <DashboardStats
        stats={[
          { label: "Total Users", value: analytics.totalUsers, icon: "users", change: Math.round((analytics.newUsersThisMonth / Math.max(analytics.totalUsers, 1)) * 100) },
          { label: "Published Events", value: analytics.totalEvents, icon: "calendar" },
          { label: "Media Uploaded", value: analytics.totalMedia, icon: "image", change: Math.round((analytics.newMediaThisMonth / Math.max(analytics.totalMedia, 1)) * 100) },
          { label: "Total Likes", value: analytics.totalLikes, icon: "heart" },
        ]}
      />

      <div className="mt-8">
        <AnalyticsCharts recentUploads={analytics.recentUploads} />
      </div>
    </div>
  );
}
