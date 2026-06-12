// src/components/admin/admin-clubs-client.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, CalendarDays, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn, formatDate, slugify } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

const createClubSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().max(500).optional(),
});

type CreateClubInput = z.infer<typeof createClubSchema>;

interface Club {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { members: number; events: number };
}

export function AdminClubsClient({ clubs }: { clubs: Club[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localClubs, setLocalClubs] = useState(clubs);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClubInput>({ resolver: zodResolver(createClubSchema) });

  const onSubmit = async (data: CreateClubInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      toast({ title: "Club created!", variant: "success" });
      setLocalClubs((prev) => [json.data, ...prev]);
      setShowCreateModal(false);
      reset();
      router.refresh();
    } catch (err) {
      toast({
        title: "Failed to create club",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Club
        </button>
      </div>

      {/* Clubs grid */}
      {localClubs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No clubs yet</p>
          <p className="text-sm mt-1">Create the first club to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {localClubs.map((club) => (
            <div
              key={club.id}
              className="bg-card border border-border rounded-2xl p-5 card-hover"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-bold text-primary">
                  {club.logoUrl ? (
                    <Image src={club.logoUrl} alt={club.name} width={48} height={48} className="object-cover" />
                  ) : (
                    club.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{club.name}</h3>
                  <p className="text-xs text-muted-foreground">/{club.slug}</p>
                </div>
                <span className={club.isActive ? "badge-published" : "badge-archived"}>
                  {club.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {club.description && (
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {club.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {club._count.members} members
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {club._count.events} events
                </span>
                <span className="ml-auto">{formatDate(club.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Create Club</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="club-name">
                  Club Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="club-name"
                  type="text"
                  placeholder="e.g. NSUT Photography Society"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                    errors.name ? "border-destructive" : "border-border"
                  )}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="club-desc">
                  Description
                </label>
                <textarea
                  id="club-desc"
                  rows={3}
                  placeholder="e.g. Official photography club of NSUT, New Delhi"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("description")}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
