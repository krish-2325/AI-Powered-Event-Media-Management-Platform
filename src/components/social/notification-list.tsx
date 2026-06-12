// src/components/social/notification-list.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NOTIFICATION_ICONS } from "@/lib/constants";
import type { Notification } from "@/lib/types/notifications";

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🔔</span>
        <h3 className="text-base font-semibold text-foreground mb-1">All caught up!</h3>
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const icon = NOTIFICATION_ICONS[notification.type] ?? "🔔";

  const href =
    notification.entityType === "media"
      ? `/media/${notification.entityId}`
      : notification.entityType === "event"
      ? `/events/${notification.entityId}`
      : notification.entityType === "comment"
      ? `/media/${notification.entityId}#comments`
      : "/notifications";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-4 p-4 transition-colors hover:bg-secondary/50",
        !notification.isRead && "bg-primary/5"
      )}
    >
      {/* Sender avatar or icon */}
      <div className="relative flex-shrink-0">
        {notification.sender ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10">
            {notification.sender.avatarUrl ? (
              <Image
                src={notification.sender.avatarUrl}
                alt={notification.sender.name}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-primary">
                {notification.sender.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {icon}
          </div>
        )}
        {/* Unread dot */}
        {!notification.isRead && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {notification.sender && (
            <span className="font-semibold">{notification.sender.name} </span>
          )}
          {notification.message.replace(notification.sender?.name ?? "", "").trim()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Notification type icon */}
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
    </Link>
  );
}
