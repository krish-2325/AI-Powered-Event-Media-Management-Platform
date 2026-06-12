// src/app/profile/settings/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Camera, User, Bell, Shield, Palette } from "lucide-react";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { FaceSelfieUpload } from "@/components/ai/face-selfie-upload";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "face-recognition" | "notifications" | "security" | "appearance";

const TABS: { value: SettingsTab; label: string; icon: React.ElementType }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "face-recognition", label: "Face Recognition", icon: Camera },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "security", label: "Security", icon: Shield },
  { value: "appearance", label: "Appearance", icon: Palette },
];

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      username: session?.user?.username ?? "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Update failed");
        return;
      }

      await update();
      setSuccessMsg("Profile updated successfully");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <aside className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab content */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground">Profile Information</h2>

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
                      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                      errors.name ? "border-destructive" : "border-border"
                    )}
                    {...register("name")}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <input
                      id="username"
                      type="text"
                      className={cn(
                        "w-full pl-8 pr-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
                        "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                        errors.username ? "border-destructive" : "border-border"
                      )}
                      {...register("username")}
                    />
                  </div>
                  {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    placeholder="e.g. Second year ECE student at NSUT. Street photography enthusiast."
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    {...register("bio")}
                  />
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium",
                      "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "face-recognition" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Face Recognition
                </h2>
                <p className="text-sm text-muted-foreground">
                  PixVault uses your reference photo to automatically find photos of you across all events. Your data is processed securely and never sold.
                </p>
              </div>

              <div className="border border-border rounded-xl p-5">
                <FaceSelfieUpload
                  existingAvatarUrl={session?.user?.avatarUrl}
                />
              </div>

              <div className="bg-secondary/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">How it works:</p>
                <p>1. Upload a clear, front-facing photo of yourself</p>
                <p>2. We extract a face descriptor (a set of numbers) — your photo is not stored</p>
                <p>3. When new event photos are uploaded, we compare faces automatically</p>
                <p>4. You get a notification when photos of you are found</p>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground">Choose what notifications you receive.</p>

              {[
                { label: "New likes on your photos", key: "likes" },
                { label: "Comments on your photos", key: "comments" },
                { label: "When someone tags you in a photo", key: "tags" },
                { label: "New followers", key: "follows" },
                { label: "Event invitations", key: "event_invites" },
                { label: "New photos uploaded to your events", key: "uploads" },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{pref.label}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground">Security</h2>

              <div className="space-y-4">
                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground mb-1">Change Password</h3>
                  <p className="text-xs text-muted-foreground mb-3">Update your account password.</p>
                  <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                    Change Password
                  </button>
                </div>

                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground mb-1">Active Sessions</h3>
                  <p className="text-xs text-muted-foreground mb-3">Manage devices where you're signed in.</p>
                  <button className="px-4 py-2 rounded-lg border border-destructive/50 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    Sign Out All Devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">
                Appearance settings are saved in your browser. Toggle the theme using the moon/sun icon in the header.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {["Light", "Dark", "System"].map((t) => (
                  <button
                    key={t}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary transition-colors"
                  >
                    <div className={cn("w-10 h-10 rounded-lg border border-border",
                      t === "Light" ? "bg-white" : t === "Dark" ? "bg-gray-900" : "bg-gradient-to-br from-white to-gray-900"
                    )} />
                    <span className="text-xs font-medium text-foreground">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
