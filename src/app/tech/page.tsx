"use client";

// Today's jobs: open jobs scheduled today or earlier. With no signal, the jobs synced last time.

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import StatusBadge from "@/components/StatusBadge";
import type { ApiError } from "@/lib/errors";
import { day } from "@/lib/format";
import { cachedJobs } from "@/lib/offline/sync";
import type { JobSummary } from "@/lib/types";
import { useTech } from "./TechProvider";

const CLOSED = ["Done", "Cancelled"];

export default function Today() {
  const { api, version } = useTech();
  const [scope, setScope] = useState<"today" | "open">("today");
  const [jobs, setJobs] = useState<JobSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listJobs(scope)
      .then((page) => {
        if (cancelled) return;
        setJobs(page.data);
        setCursor(page.next_cursor);
        setFromCache(false);
        setError(null);
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        if (err.isOffline) {
          const today = new Date().toISOString().slice(0, 10);
          const cached = Object.values(cachedJobs(localStorage)).filter(
            (j) => !CLOSED.includes(j.status) && (scope === "open" || (j.scheduled_date ?? "") <= today),
          );
          setJobs(cached.sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? "")));
          setCursor(null);
          setFromCache(true);
        } else setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [api, scope, version]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await api.listJobs(scope, cursor);
      setJobs((current) => [...(current ?? []), ...page.data]);
      setCursor(page.next_cursor);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm">
        {(["today", "open"] as const).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`flex-1 rounded-md py-1.5 font-medium ${scope === s ? "bg-white shadow-sm" : "text-slate-500"}`}>
            {s === "today" ? "Today" : "All open"}
          </button>
        ))}
      </div>
      <ErrorNote error={error} />
      {fromCache && <p className="mb-3 text-xs text-slate-500">No signal: showing jobs from the last sync.</p>}
      {jobs === null ? (
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </ul>
      ) : jobs.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No jobs {scope === "today" ? "for today" : "open"}.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/tech/jobs/${job.id}`} className="card block active:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{job.issue}</p>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{job.customer.name}</p>
                <p className="text-xs text-slate-500">
                  {day(job.scheduled_date)}
                  {job.priority === "Urgent" ? " · Urgent" : ""} · {job.site_address}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button className="btn-secondary mt-4 w-full" onClick={() => void loadMore()} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
