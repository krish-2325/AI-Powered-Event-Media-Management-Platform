// src/components/layout/header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { useNotificationPolling } from "@/lib/hooks/use-notification-polling";
import { useTheme } from "next-themes";
import { useNotificationStore } from "@/store";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotificationStore();
  useNotificationPolling();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4 gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search events, photos, tags — try holi, ladakh, techfest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-lg text-sm",
                "bg-secondary border-0",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "transition-shadow duration-200"
              )}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-secondary transition-colors duration-200"
            )}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications */}
          <Link
            href={ROUTES.NOTIFICATIONS}
            className={cn(
              "relative w-9 h-9 rounded-lg flex items-center justify-center",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-secondary transition-colors duration-200"
            )}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
