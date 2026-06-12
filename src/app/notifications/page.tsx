// src/app/notifications/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { NotificationList } from "@/components/social/notification-list";

export const metadata = { title: "Notifications" };

async function getNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  // Mark all as read
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  return notifications;
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const notifications = await getNotifications(session.user.id);

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-description">{notifications.filter((n) => !n.isRead).length} unread</p>
      </div>
      <NotificationList notifications={notifications as any} />
    </div>
  );
}
