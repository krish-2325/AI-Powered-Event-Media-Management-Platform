// src/lib/hooks/use-notification-polling.ts
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useNotificationStore } from "@/store/notification-store";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotificationPolling() {
  const { data: session } = useSession();
  const { setUnreadCount } = useNotificationStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef<number>(0);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const count: number = data?.data?.count ?? 0;

        // Play subtle sound if new notifications arrived
        if (count > lastCountRef.current && lastCountRef.current !== 0) {
          // Use Web Notifications API if permission granted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("PixVault", {
              body: `You have ${count - lastCountRef.current} new notification${count - lastCountRef.current > 1 ? "s" : ""}`,
              icon: "/icons/icon-192x192.png",
            });
          }
        }

        lastCountRef.current = count;
        setUnreadCount(count);
      } catch {
        // Silently ignore network errors
      }
    };

    // Fetch immediately on mount
    fetchUnread();

    // Then poll every 30 seconds
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session?.user, setUnreadCount]);

  // Request notification permission on first call
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);
}
