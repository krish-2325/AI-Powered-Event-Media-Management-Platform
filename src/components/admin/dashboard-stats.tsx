// src/components/admin/dashboard-stats.tsx

import { CalendarDays, Images, Heart, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: number;
  icon: "calendar" | "image" | "heart" | "users";
  change?: number;
}

interface DashboardStatsProps {
  stats: Stat[];
}

const ICONS = {
  calendar: CalendarDays,
  image: Images,
  heart: Heart,
  users: Users,
};

const ICON_COLORS = {
  calendar: "text-blue-500 bg-blue-500/10",
  image: "text-violet-500 bg-violet-500/10",
  heart: "text-rose-500 bg-rose-500/10",
  users: "text-emerald-500 bg-emerald-500/10",
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = ICONS[stat.icon];
        const colorClass = ICON_COLORS[stat.icon];

        return (
          <div
            key={stat.label}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display">
                {formatNumber(stat.value)}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.change !== undefined && (
                <p className={cn("text-xs mt-0.5 font-medium", stat.change >= 0 ? "text-emerald-600" : "text-destructive")}>
                  {stat.change >= 0 ? "+" : ""}{stat.change}% this month
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
