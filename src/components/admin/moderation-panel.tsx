// src/components/admin/moderation-panel.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, CheckCircle, Trash2, Loader2, Eye, RefreshCw } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface FlaggedMedia {
  id: string;
  originalUrl: string;
  thumbnailUrl?: string | null;
  aiTags: string[];
  createdAt: Date;
  uploader: { id: string; name: string; username: string };
  event: { id: string; title: string; slug: string };
}

export function ModerationPanel() {
  const [flagged, setFlagged] = useState<FlaggedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadFlagged = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      setFlagged(data.data ?? []);
    } catch {
      toast({ title: "Failed to load flagged content", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadFlagged(); }, []);

  const handleApprove = async (mediaId: string) => {
    setActionId(mediaId);
    try {
      const res = await fetch(`/api/admin/moderation/${mediaId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setFlagged((prev) => prev.filter((m) => m.id !== mediaId));
      toast({ title: "Media approved", variant: "success" });
    } catch {
      toast({ title: "Action failed", variant: "error" });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Permanently delete this media?")) return;
    setActionId(mediaId);
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setFlagged((prev) => prev.filter((m) => m.id !== mediaId));
      toast({ title: "Media deleted", variant: "success" });
    } catch {
      toast({ title: "Deletion failed", variant: "error" });
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <h2 className="text-base font-semibold text-foreground">
            Flagged Content
          </h2>
          {flagged.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
              {flagged.length}
            </span>
          )}
        </div>
        <button onClick={loadFlagged} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {flagged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl">
          <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
          <p className="text-sm font-semibold text-foreground">All clear!</p>
          <p className="text-xs text-muted-foreground mt-1">No flagged content to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flagged.map((media) => {
            const flagReasons = media.aiTags
              .filter((t) => t.startsWith("__FLAGGED_"))
              .map((t) => t.replace("__FLAGGED_", "").replace("_", " ").toLowerCase());

            return (
              <div key={media.id} className="bg-card border border-destructive/30 rounded-2xl overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-40 bg-muted">
                  {(media.thumbnailUrl ?? media.originalUrl) && (
                    <Image
                      src={media.thumbnailUrl ?? media.originalUrl}
                      alt="Flagged media"
                      fill
                      className="object-cover opacity-60"
                      sizes="300px"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldAlert className="w-10 h-10 text-destructive" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      By <Link href={`/profile/${media.uploader.username}`} className="text-primary hover:underline">{media.uploader.name}</Link>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      In <Link href={`/events/${media.event.slug}`} className="hover:text-primary">{media.event.title}</Link>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(media.createdAt)}</p>
                  </div>

                  {flagReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {flagReasons.map((reason) => (
                        <span key={reason} className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-xs">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/media/${media.id}`} target="_blank"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <Eye className="w-3 h-3" />
                      View
                    </Link>
                    <button onClick={() => handleApprove(media.id)} disabled={actionId === media.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50">
                      {actionId === media.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Approve
                    </button>
                    <button onClick={() => handleDelete(media.id)} disabled={actionId === media.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-destructive/40 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 ml-auto">
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
