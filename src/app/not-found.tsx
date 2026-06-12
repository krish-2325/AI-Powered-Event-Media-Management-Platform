// src/app/not-found.tsx

import Link from "next/link";
import { Camera } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
        <Camera className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-6xl font-bold font-display text-foreground mb-2">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-3">Page not found</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-8">
        The page you're looking for doesn't exist, was moved, or you don't have permission to view it.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/events"
          className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Browse Events
        </Link>
      </div>
    </div>
  );
}
