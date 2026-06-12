// src/components/ui/toaster.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeToasts, dismissToast, type Toast } from "@/lib/hooks/use-toast";

const VARIANT_STYLES = {
  default:  "bg-card border-border text-foreground",
  success:  "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100",
  error:    "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-100",
  warning:  "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-100",
};

const VARIANT_ICONS = {
  default: Info,
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
};

const ICON_COLORS = {
  default: "text-muted-foreground",
  success: "text-emerald-500",
  error:   "text-red-500",
  warning: "text-amber-500",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const Icon = VARIANT_ICONS[t.variant ?? "default"];
        const iconColor = ICON_COLORS[t.variant ?? "default"];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto",
              "animate-fade-in",
              VARIANT_STYLES[t.variant ?? "default"]
            )}
          >
            <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
