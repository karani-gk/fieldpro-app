"use client";

import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import type { WeekStats } from "@/lib/types";
import { useTech } from "../TechProvider";

export default function MyWeek() {
  const { api, version } = useTech();
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    api.myWeek().then(setStats).catch(setError);
  }, [api, version]);

  if (error) return <ErrorNote error={error} />;
  if (!stats) return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  const most = Math.max(1, ...stats.days.map((d) => d.hours));
  return (
    <div className="space-y-4 lg:max-w-4xl lg:space-y-6">
      <div>
        <p className="eyebrow hidden lg:block">Last 7 days</p>
        <h1 className="text-xl font-bold lg:mt-1 lg:text-3xl lg:tracking-tight">My week</h1>
      </div>
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {[
          ["Jobs done", stats.jobs_done],
          ["Visits", stats.visits],
          ["Hours", stats.hours.toFixed(1)],
        ].map(([label, value]) => (
          <div key={label} className="card text-center lg:p-6">
            <p className="text-2xl font-bold lg:text-4xl">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="card lg:p-6">
        <p className="mb-3 text-sm font-medium">Hours per day</p>
        {/* Each day's column fills the chart's height, so a bar's percentage height has something to
            be a percentage of (with items-end the columns shrank and every bar sat at its minimum). */}
        <div className="flex h-32 gap-2 lg:h-56 lg:gap-4">
          {stats.days.map((d) => (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t-md bg-gradient-to-t from-brand to-mint" style={{ height: `${(d.hours / most) * 100}%`, minHeight: d.hours ? 4 : 0 }} title={`${d.hours} h`} />
              <span className="text-[10px] text-slate-500">{new Date(`${d.date}T00:00:00`).toLocaleDateString("en-KE", { weekday: "short" })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
