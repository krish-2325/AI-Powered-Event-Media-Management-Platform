// src/components/events/create-event-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar, MapPin, Lock, Users, Globe, ImagePlus } from "lucide-react";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ACCESS_LEVELS = [
  { value: "PUBLIC", label: "Public", desc: "Visible to everyone", icon: Globe },
  { value: "MEMBERS_ONLY", label: "Members Only", desc: "Club members only", icon: Users },
  { value: "PRIVATE", label: "Private", desc: "Only you and admins", icon: Lock },
] as const;

export function CreateEventForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      category: "OTHER",
      accessLevel: "PUBLIC",
    },
  });

  const selectedAccess = watch("accessLevel");
  const selectedCategory = watch("category");

  const onSubmit = async (data: CreateEventInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to create event");
        return;
      }

      router.push(ROUTES.EVENT(json.data.slug));
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="title">
            Event Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Diwali Photowalk 2024 – Chandni Chowk"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              errors.title ? "border-destructive" : "border-border"
            )}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe the event — location, activities, what members should bring..."
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
              "placeholder:text-muted-foreground resize-none",
              "focus:outline-none focus:ring-2 focus:ring-ring border-border"
            )}
            {...register("description")}
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("category", value as any)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                selectedCategory === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <span className="text-xl">{EVENT_CATEGORY_ICONS[value as keyof typeof EVENT_CATEGORY_ICONS]}</span>
              <span className="text-xs font-medium leading-tight">{label}</span>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Access Level */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Access Level</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACCESS_LEVELS.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("accessLevel", value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                selectedAccess === value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", selectedAccess === value ? "text-primary" : "text-muted-foreground")} />
              <div>
                <p className={cn("text-sm font-medium", selectedAccess === value ? "text-primary" : "text-foreground")}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Event Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="startDate">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="startDate"
                type="datetime-local"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("startDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="endDate">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="endDate"
                type="datetime-local"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("endDate")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="location">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="location"
              type="text"
              placeholder="e.g. NSUT Campus, Dwarka, New Delhi"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("location")}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg",
            "bg-primary text-primary-foreground text-sm font-medium",
            "hover:bg-primary/90 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}
