// src/components/events/albums-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Images, Lock, Users, Globe, Trash2, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAlbumSchema, type CreateAlbumInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface Album {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  accessLevel: string;
  createdAt: Date;
  _count: { media: number };
  media: Array<{ thumbnailUrl?: string | null; originalUrl: string }>;
}

interface AlbumsClientProps {
  event: { id: string; slug: string; title: string };
  albums: Album[];
  canManage: boolean;
}

const ACCESS_ICONS = { PUBLIC: Globe, MEMBERS_ONLY: Users, PRIVATE: Lock };

export function AlbumsClient({ event, albums, canManage }: AlbumsClientProps) {
  const router = useRouter();
  const [localAlbums, setLocalAlbums] = useState<Album[]>(albums);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<CreateAlbumInput>({
      resolver: zodResolver(createAlbumSchema),
      defaultValues: { eventId: event.id, accessLevel: "PUBLIC" },
    });

  const selectedAccess = watch("accessLevel");

  const onSubmit = async (data: CreateAlbumInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setLocalAlbums((prev) => [...prev, json.data]);
      toast({ title: "Album created!", variant: "success" });
      setShowCreate(false);
      reset();
    } catch (err) {
      toast({ title: "Failed to create album", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (albumId: string, albumName: string) => {
    if (!confirm(`Delete album "${albumName}"? Media inside will not be deleted.`)) return;
    setDeletingId(albumId);
    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setLocalAlbums((prev) => prev.filter((a) => a.id !== albumId));
      toast({ title: "Album deleted", variant: "success" });
    } catch {
      toast({ title: "Failed to delete album", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      {canManage && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Album
          </button>
        </div>
      )}

      {/* Albums grid */}
      {localAlbums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">No albums yet</h3>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Create your first album to organize media." : "No albums have been created for this event."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {localAlbums.map((album) => {
            const AccessIcon = ACCESS_ICONS[album.accessLevel as keyof typeof ACCESS_ICONS] ?? Globe;
            const cover = album.coverUrl ?? album.media[0]?.thumbnailUrl ?? album.media[0]?.originalUrl;

            return (
              <div key={album.id} className="group relative bg-card border border-border rounded-2xl overflow-hidden card-hover">
                {/* Cover */}
                <Link href={`/events/${event.slug}/albums/${album.id}`}>
                  <div className="relative h-36 bg-muted overflow-hidden">
                    {cover ? (
                      <Image src={cover} alt={album.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="400px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <AccessIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/events/${event.slug}/albums/${album.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">{album.name}</h3>
                  </Link>
                  {album.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{album.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Images className="w-3.5 h-3.5" />
                      {album._count.media} photos
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(album.id, album.name)}
                        disabled={deletingId === album.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingId === album.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create album modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Create Album</h2>
              <button onClick={() => { setShowCreate(false); reset(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <input type="hidden" {...register("eventId")} />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Album Name *</label>
                <input type="text" placeholder="e.g. Ganga Aarti – Best Shots" className={cn("w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring", errors.name ? "border-destructive" : "border-border")} {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea rows={2} placeholder="e.g. Top 20 photos from the evening shoot" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" {...register("description")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Access</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PUBLIC", "MEMBERS_ONLY", "PRIVATE"] as const).map((level) => {
                    const Icon = ACCESS_ICONS[level];
                    const labels = { PUBLIC: "Public", MEMBERS_ONLY: "Members", PRIVATE: "Private" };
                    return (
                      <button key={level} type="button" onClick={() => setValue("accessLevel", level)}
                        className={cn("flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors",
                          selectedAccess === level ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                        )}>
                        <Icon className="w-4 h-4" />
                        {labels[level]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
