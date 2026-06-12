// src/components/events/event-filters.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS } from "@/lib/constants";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category");

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground mr-1">Category:</span>

      <button
        onClick={() => updateFilter("category", null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          !selectedCategory
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </button>

      {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
        <button
          key={value}
          onClick={() =>
            updateFilter("category", selectedCategory === value ? null : value)
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>{EVENT_CATEGORY_ICONS[value as keyof typeof EVENT_CATEGORY_ICONS]}</span>
          {label}
        </button>
      ))}

      {selectedCategory && (
        <button
          onClick={() => updateFilter("category", null)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
