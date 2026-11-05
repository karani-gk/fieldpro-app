"use client";

// The technician's jobs: today's (open jobs scheduled today or earlier), every open job, or the
// finished ones (Done and Cancelled, latest first). With no signal, the jobs synced last time.

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import { Calendar, Pin } from "@/components/icons";
import StatusBadge from "@/components/StatusBadge";
import type { JobScope } from "@/lib/api";
import type { ApiError } from "@/lib/errors";
import { day } from "@/lib/format";
import { cachedJobs } from "@/lib/offline/sync";
import type { JobSummary } from "@/lib/types";
import { useTech } from "./TechProvider";

const CLOSED = ["Done", "Cancelled"];

type Tab = Extract<JobScope, "today" | "open" | "finished">;
const TABS: { scope: Tab; label: string; heading: string; empty: string }[] = [
  { scope: "today", label: "Today", heading: "Today's jobs", empty: "No jobs for today." },
  { scope: "open", label: "Open", heading: "All open jobs", empty: "No open jobs." },
  { scope: "finished", label: "Finished", heading: "Finished jobs", empty: "No finished jobs yet." },
];

// The colour down a card's left edge, so a long list reads at a glance.
const EDGE: Record<string, string> = {
  Assigned: "border-l-indigo-400",
  "In Progress": "border-l-amber-400",
  "Pending Approval": "border-l-rose-400",
  "Awaiting Sign-off": "border-l-orange-400",
  Rework: "border-l-rose-500",
  Done: "border-l-emerald-400",
  Cancelled: "border-l-slate-300",
};

/** Jobs from the last sync that belong on this tab, for when there is no signal. */
function fromCache(scope: Tab): JobSummary[] {
  const today = new Date().toISOString().slice(0, 10);
  const all = Object.values(cachedJobs(localStorage));
  if (scope === "finished") {
    return all.filter((j) => CLOSED.includes(j.status)).sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
  }
  return all
    .filter((j) => !CLOSED.includes(j.status) && (scope === "open" || (j.scheduled_date ?? "") <= today))
    .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""));
}

export default function Jobs() {
  const { api, version } = useTech();
  const [scope, setScope] = useState<Tab>("today");
  const [jobs, setJobs] = useState<JobSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const tab = TABS.find((t) => t.scope === scope)!;

  useEffect(() => {
    let cancelled = false;
    setJobs(null);
    api
      .listJobs(scope)
      .then((page) => {
        if (cancelled) return;
        setJobs(page.data);
        setCursor(page.next_cursor);
        setCached(false);
        setError(null);
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        if (err.isOffline) {
          setJobs(fromCache(scope));
          setCursor(null);
          setCached(true);
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
      <div className="mb-5 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="hidden lg:block">
          <p className="eyebrow">{new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{tab.heading}</h1>
          {jobs && (
            <p className="mt-1 text-sm text-slate-500">
              {jobs.length}
              {cursor ? "+" : ""} job{jobs.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex rounded-xl bg-slate-200/60 p-1 text-sm lg:w-96" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.scope}
              role="tab"
              aria-selected={scope === t.scope}
              onClick={() => setScope(t.scope)}
              className={`flex-1 rounded-lg py-1.5 font-medium transition ${scope === t.scope ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorNote error={error} />
      {cached && <p className="mb-3 text-xs text-slate-500">No signal: showing jobs from the last sync.</p>}

      {jobs === null ? (
        <ul className="grid gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </ul>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">{tab.empty}</div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <div className="mt-6 flex justify-center">
          <button className="btn-secondary w-full lg:w-auto lg:px-8" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: JobSummary }) {
  const today = new Date().toISOString().slice(0, 10);
  const late = !CLOSED.includes(job.status) && !!job.scheduled_date && job.scheduled_date < today;
  return (
    <Link
      href={`/tech/jobs/${job.id}`}
      className={`card group flex h-full flex-col border-l-4 transition hover:-translate-y-0.5 hover:shadow-lift active:bg-slate-50 ${EDGE[job.status] ?? "border-l-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug group-hover:text-brand">{job.issue}</p>
        <StatusBadge status={job.status} />
      </div>
      <p className="mt-1 text-sm text-slate-600">{job.customer.name}</p>
      {job.site_address && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
          <Pin className="mt-px h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{job.site_address}</span>
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs">
        <span className={`inline-flex items-center gap-1.5 font-medium ${late ? "text-rose-600" : "text-slate-500"}`}>
          <Calendar className="h-3.5 w-3.5" />
          {day(job.scheduled_date)}
          {late && " · late"}
        </span>
        <span className="flex items-center gap-2">
          {job.priority === "Urgent" && <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">Urgent</span>}
          <span className="text-slate-400">{job.id}</span>
        </span>
      </div>
    </Link>
  );
}
