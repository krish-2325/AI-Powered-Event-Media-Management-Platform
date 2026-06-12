// src/components/events/event-settings-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, Globe, Users, Lock, Eye, Archive, Upload } from "lucide-react";
import { updateEventSchema, type UpdateEventInput } from "@/lib/validations";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";
import type { Event } from "@/lib/types/event";

interface EventSettingsClientProps {
  event: Event & {
    club?: { id: string; name: string; slug: string } | null;
    _count: { media: number };
  };
}

const ACCESS_LEVELS = [
  { value: "PUBLIC", label: "Public", icon: Globe },
  { value: "MEMBERS_ONLY", label: "Members Only", icon: Users },
  { value: "PRIVATE", label: "Private", icon: Lock },
] as const;

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", icon: Eye, desc: "Only visible to you" },
  { value: "PUBLISHED", label: "Published", icon: Upload, desc: "Visible to everyone" },
  { value: "ARCHIVED", label: "Archived", icon: Archive, desc: "Hidden from listings" },
] as const;

export function EventSettingsClient({ event }: EventSettingsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateEventInput>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description ?? "",
      category: event.category,
      accessLevel: event.accessLevel,
      location: event.location ?? "",
      status: event.status,
      startDate: event.startDate
        ? new Date(event.startDate).toISOString().slice(0, 16)
        : undefined,
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().slice(0, 16)
        : undefined,
    },
  });

  const selectedAccess = watch("accessLevel");
  const selectedStatus = watch("status");
  const selectedCategory = watch("category");

  const onSubmit = async (data: UpdateEventInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      toast({ title: "Event updated!", variant: "success" });
      router.refresh();
      if (json.data.slug !== event.slug) {
        router.push(`/events/${json.data.slug}/settings`);
      }
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== event.title) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Event deleted", variant: "success" });
      router.push(ROUTES.EVENTS);
    } catch {
      toast({ title: "Failed to delete event", variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basic Information</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Event Title</label>
          <input
            type="text"
            className={cn("w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring", errors.title ? "border-destructive" : "border-border")}
            {...register("title")}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Location</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("location")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date</label>
            <input type="datetime-local" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register("startDate")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">End Date</label>
            <input type="datetime-local" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register("endDate")} />
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setValue("category", value as any, { shouldDirty: true })}
              className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all text-xs font-medium",
                selectedCategory === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}>
              <span className="text-lg">{EVENT_CATEGORY_ICONS[value as keyof typeof EVENT_CATEGORY_ICONS]}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Access level */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Access Level</h2>
        <div className="grid grid-cols-3 gap-3">
          {ACCESS_LEVELS.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => setValue("accessLevel", value, { shouldDirty: true })}
              className={cn("flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-sm",
                selectedAccess === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Status</h2>
        <div className="grid grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
            <button key={value} type="button" onClick={() => setValue("status", value, { shouldDirty: true })}
              className={cn("flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                selectedStatus === value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}>
              <div className="flex items-center gap-1.5">
                <Icon className={cn("w-3.5 h-3.5", selectedStatus === value ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-semibold", selectedStatus === value ? "text-primary" : "text-foreground")}>{label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button type="submit" disabled={isSubmitting || !isDirty}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
        <p className="text-xs text-muted-foreground">{event._count.media} media files in this event</p>
      </div>

      {/* Danger zone */}
      <div className="border border-destructive/30 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
        <p className="text-xs text-muted-foreground">
          Permanently delete this event and all its media. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button type="button" onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Event
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-foreground">
              Type <strong>{event.title}</strong> to confirm deletion:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={event.title}
              className="w-full px-4 py-2 rounded-lg border border-destructive bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleteInput !== event.title || isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50">
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
