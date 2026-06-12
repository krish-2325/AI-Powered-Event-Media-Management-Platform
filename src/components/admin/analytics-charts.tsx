// src/components/admin/analytics-charts.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface AnalyticsChartsProps {
  recentUploads: Array<{ date: string; count: number }>;
}

export function AnalyticsCharts({ recentUploads }: AnalyticsChartsProps) {
  const chartData = recentUploads.map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    uploads: d.count,
  }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-semibold text-foreground mb-6">
          Uploads – Last 14 Days
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(230 100% 66%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(230 100% 66%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(220 8.9% 46.1%)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(220 8.9% 46.1%)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(224 71.4% 6%)",
                  border: "1px solid hsl(215 27.9% 16.9%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210 20% 98%)",
                }}
                cursor={{ stroke: "hsl(230 100% 66%)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="uploads"
                stroke="hsl(230 100% 66%)"
                strokeWidth={2}
                fill="url(#uploadGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(230 100% 66%)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
