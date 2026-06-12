// src/app/dashboard/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RecentEvents } from "@/components/events/recent-events";
import { RecentMedia } from "@/components/media/recent-media";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const [
    totalEvents,
    totalMedia,
    totalLikes,
    recentEvents,
    recentMedia,
  ] = await Promise.all([
    prisma.event.count({ where: { ownerId: userId } }),
    prisma.media.count({ where: { uploaderId: userId } }),
    prisma.like.count({
      where: { media: { uploaderId: userId } },
    }),
    prisma.event.findMany({
      where: { ownerId: userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { media: true } },
      },
    }),
    prisma.media.findMany({
      where: { uploaderId: userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  return { totalEvents, totalMedia, totalLikes, recentEvents, recentMedia };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const data = await getDashboardData(session.user.id);

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="page-header">
        <p className="text-muted-foreground text-sm">
          {formatDate(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="page-title">
          Welcome back, {session.user.name.split(" ")[0]} 👋
        </h1>
      </div>

      {/* Stats */}
      <DashboardStats
        stats={[
          { label: "Events Created", value: data.totalEvents, icon: "calendar" },
          { label: "Photos Uploaded", value: data.totalMedia, icon: "image" },
          { label: "Total Likes", value: data.totalLikes, icon: "heart" },
        ]}
      />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <RecentEvents events={data.recentEvents} />
        </div>
        <div>
          <RecentMedia media={data.recentMedia} />
        </div>
      </div>
    </div>
  );
}
