// src/components/search-filters.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { CalendarDays, X, SlidersHorizontal } from "lucide-react";
import { EVENT_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get("category") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const hasFilters = category || startDate || endDate;

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    ["category", "startDate", "endDate"].forEach((k) => params.delete(k));
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
            showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-secondary"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center leading-none">
              {[category, startDate, endDate].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          {/* Category filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Category</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => update("category", "")}
                className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  !category ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}>All</button>
              {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => update("category", category === value ? "" : value)}
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    category === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}>{label}</button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                <CalendarDays className="w-3 h-3 inline mr-1" />
                From date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                <CalendarDays className="w-3 h-3 inline mr-1" />
                To date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
