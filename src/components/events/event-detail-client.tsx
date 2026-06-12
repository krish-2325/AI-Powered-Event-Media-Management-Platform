// src/components/events/event-detail-client.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays, MapPin, Lock, Users, Globe, Images, Edit,
  Upload, LayoutGrid, Rows, LayoutList, FolderOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EVENT_CATEGORY_ICONS, EVENT_CATEGORY_LABELS, ROUTES } from "@/lib/constants";
import { MediaGallery } from "@/components/media/media-gallery";
import { MediaUploader } from "@/components/media/media-uploader";
import { EventQRShare } from "@/components/events/event-qr-share";
import { AlbumsClient } from "@/components/events/albums-client";
import { cn } from "@/lib/utils";
import type { Event, Album } from "@/lib/types/event";
import type { MediaWithRelations } from "@/lib/types/media";
import type { UserRole } from "@/lib/types/user";

interface EventDetailClientProps {
  event: Event & {
    owner: { id: string; name: string; username: string; avatarUrl?: string | null };
    club?: { id: string; name: string; slug: string; logoUrl?: string | null } | null;
    albums: (Album & { _count: { media: number }; media: Array<{ thumbnailUrl?: string | null; originalUrl: string }> })[];
    _count: { media: number };
  };
  media: MediaWithRelations[];
  currentUserId?: string;
  isOwner: boolean;
  userRole?: UserRole;
}

type GalleryView = "masonry" | "grid" | "list";
type TabKey = "gallery" | "albums" | "upload";

const ACCESS_ICONS = { PUBLIC: Globe, MEMBERS_ONLY: Users, PRIVATE: Lock };
const ACCESS_LABELS = { PUBLIC: "Public", MEMBERS_ONLY: "Members Only", PRIVATE: "Private" };

export function EventDetailClient({
  event, media, currentUserId, isOwner, userRole,
}: EventDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("gallery");
  const [galleryView, setGalleryView] = useState<GalleryView>("masonry");
  const [localMedia] = useState(media);

  const AccessIcon = ACCESS_ICONS[event.accessLevel as keyof typeof ACCESS_ICONS];
  const canUpload = isOwner || userRole === "PHOTOGRAPHER" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "gallery", label: `Gallery (${event._count.media})`, icon: Images },
    { key: "albums", label: `Albums (${event.albums.length})`, icon: FolderOpen },
    ...(canUpload ? [{ key: "upload" as TabKey, label: "Upload", icon: Upload }] : []),
  ];

  return (
    <div>
      {/* Hero */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-brand-700 to-brand-950 overflow-hidden">
        {event.coverUrl && (
          <Image src={event.coverUrl} alt={event.title} fill className="object-cover opacity-60" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-4 left-4">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
            <span>{EVENT_CATEGORY_ICONS[event.category as keyof typeof EVENT_CATEGORY_ICONS]}</span>
            {EVENT_CATEGORY_LABELS[event.category as keyof typeof EVENT_CATEGORY_LABELS]}
          </span>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <EventQRShare eventSlug={event.slug} eventTitle={event.title} />
          {isOwner && (
            <Link href={`/events/${event.slug}/settings`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-colors">
              <Edit className="w-3.5 h-3.5" />Edit
            </Link>
          )}
        </div>
      </div>

      <div className="page-container max-w-6xl">
        {/* Event info */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-3">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {event.startDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {formatDate(event.startDate)}{event.endDate && ` – ${formatDate(event.endDate)}`}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.location}</span>
              )}
              <span className="flex items-center gap-1.5">
                <AccessIcon className="w-4 h-4" />
                {ACCESS_LABELS[event.accessLevel as keyof typeof ACCESS_LABELS]}
              </span>
              <span className="flex items-center gap-1.5"><Images className="w-4 h-4" />{event._count.media} photos</span>
            </div>
            {event.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{event.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10">
              {event.owner.avatarUrl && <Image src={event.owner.avatarUrl} alt={event.owner.name} width={40} height={40} className="object-cover" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organized by</p>
              <Link href={ROUTES.PROFILE(event.owner.username)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                {event.owner.name}
              </Link>
              {event.club && <p className="text-xs text-muted-foreground">{event.club.name}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 border-b border-border pb-1">
          <div className="flex gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn("flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {activeTab === "gallery" && (
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              {(["masonry", "grid", "list"] as const).map((v) => {
                const icons = { masonry: LayoutGrid, grid: Rows, list: LayoutList };
                const Icon = icons[v];
                return (
                  <button key={v} onClick={() => setGalleryView(v)}
                    className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                      galleryView === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === "gallery" && <MediaGallery media={localMedia} view={galleryView} />}

        {activeTab === "albums" && (
          <AlbumsClient
            event={{ id: event.id, slug: event.slug, title: event.title }}
            albums={event.albums as any}
            canManage={canUpload}
          />
        )}

        {activeTab === "upload" && canUpload && (
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground mb-4">
              Photos are automatically tagged with AI (crowd, stage, festival, mountains etc.), checked for inappropriate content, and scanned for duplicates after upload.
            </p>
            <MediaUploader eventId={event.id} onUploadComplete={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  );
}
