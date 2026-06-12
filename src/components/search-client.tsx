// src/components/search-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, User } from "lucide-react";
import { EventCard } from "./events/event-card";
import { MediaCard } from "./media/media-card";
import { cn, formatNumber } from "@/lib/utils";
import { USER_ROLE_LABELS, ROUTES } from "@/lib/constants";

type Tab = "all" | "events" | "media" | "people";

interface SearchClientProps {
  query: string;
  events: any[];
  media: any[];
  users: Array<{
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    role: string;
    bio?: string | null;
  }>;
}

export function SearchClient({ query, events, media, users }: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchInput, setSearchInput] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`${pathname}?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "all", label: "All", count: events.length + media.length + users.length },
    { value: "events", label: "Events", count: events.length },
    { value: "media", label: "Photos", count: media.length },
    { value: "people", label: "People", count: users.length },
  ];

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search — try diwali, techfest, ladakh, arjun_clicks..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
            autoFocus
          />
        </div>
      </form>

      {!query ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Start searching</p>
          <p className="text-sm mt-1">Search for events, photos by AI tag (holi, crowd, mountains), or people</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
                  "border-b-2 -mb-px",
                  activeTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-10">
            {/* Events */}
            {(activeTab === "all" || activeTab === "events") && events.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Events
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Media */}
            {(activeTab === "all" || activeTab === "media") && media.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Photos & Videos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {media.map((item) => (
                    <MediaCard key={item.id} media={item} />
                  ))}
                </div>
              </section>
            )}

            {/* People */}
            {(activeTab === "all" || activeTab === "people") && users.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  People
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={ROUTES.PROFILE(user.username)}
                      className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl card-hover"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                        {user.avatarUrl ? (
                          <Image src={user.avatarUrl} alt={user.name} width={48} height={48} className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
                        )}
                      </div>
                      <span className="tag-pill flex-shrink-0 ml-auto">
                        {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS]}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {events.length === 0 && media.length === 0 && users.length === 0 && (
              <div className="text-center py-20">
                <span className="text-5xl">🔍</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No results found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
