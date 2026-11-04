"use client";

// The customer's jobs, newest first. A job that changes anywhere (Desk, the technician's phone)
// is pushed here over socket.io and its row updates without a refresh.

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import StatusBadge from "@/components/StatusBadge";
import { portal } from "@/lib/api";
import { dateTime, day } from "@/lib/format";
import type { JobSummary } from "@/lib/types";
import { usePortal } from "./PortalProvider";

export default function MyJobs() {
  const { version, lastEvent } = usePortal();
  const [jobs, setJobs] = useState<JobSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    portal
      .myJobs()
      .then((page) => {
        setJobs(page.data);
        setCursor(page.next_cursor);
      })
      .catch(setError);
  }, [version]);

  async function loadMore() {
    try {
      const page = await portal.myJobs(cursor);
      setJobs((current) => [...(current ?? []), ...page.data]);
      setCursor(page.next_cursor);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your jobs</h1>
      <ErrorNote error={error} />
      {jobs === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      ) : jobs.length === 0 ? (
        <p className="card text-sm text-slate-600">
          No jobs yet. <Link href="/portal/book" className="text-brand underline">Book your first one.</Link>
        </p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className={`border-b border-slate-100 last:border-0 ${lastEvent?.id === job.id ? "bg-emerald-50" : ""}`} data-testid={`row-${job.id}`}>
                  <td className="px-4 py-3">
                    <Link href={`/portal/jobs/${job.id}`} className="font-semibold text-brand underline-offset-2 hover:underline">
                      {job.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{job.issue}</td>
                  <td className="px-4 py-3 text-slate-600">{day(job.scheduled_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{job.technician?.name ?? "Not assigned yet"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                    <p className="mt-0.5 text-[11px] text-slate-400">{dateTime(job.updated_at)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cursor && (
        <button className="btn-secondary mt-4" onClick={() => void loadMore()}>
          Load more
        </button>
      )}
    </div>
  );
}
