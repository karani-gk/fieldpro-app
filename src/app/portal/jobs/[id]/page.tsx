"use client";

// One job in the portal: what was done, by whom, and the customer's decision when the work is
// finished. The buttons are the actions the server says this customer may take now.

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import StatusBadge from "@/components/StatusBadge";
import { portal } from "@/lib/api";
import { dateTime, day, money } from "@/lib/format";
import type { JobDetail } from "@/lib/types";
import { usePortal } from "../../PortalProvider";

export default function PortalJob({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const { version, refresh } = usePortal();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    portal.getJob(id).then(setJob).catch(setError);
  }, [id, version]);

  async function act(action: string, why?: string) {
    setBusy(action);
    setError(null);
    try {
      setJob(await portal.apply(id, action, why));
      setRejecting(false);
      refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  if (!job) return error ? <ErrorNote error={error} /> : <div className="h-60 animate-pulse rounded-xl bg-slate-100" />;

  return (
    <div className="space-y-4">
      <Link href="/portal" className="text-sm text-slate-500">
        ← Your jobs
      </Link>
      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">{job.id}</p>
            <h1 className="text-xl font-bold">{job.issue}</h1>
          </div>
          <StatusBadge status={job.status} />
        </div>
        {job.description && <p className="mt-2 text-sm text-slate-700">{job.description}</p>}
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd>{day(job.scheduled_date)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Technician</dt>
            <dd>{job.technician?.name ?? "Not assigned yet"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Site</dt>
            <dd>{job.site_address || "-"}</dd>
          </div>
        </dl>
      </section>

      <ErrorNote error={error} />

      {job.actions.length > 0 && (
        <section className="card space-y-3 border-orange-200 bg-orange-50" data-testid="decision">
          <p className="font-semibold">The work is finished. Are you happy with it?</p>
          {rejecting ? (
            <>
              <textarea className="input" rows={2} placeholder="What still needs fixing?" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setRejecting(false)}>
                  Back
                </button>
                <button className="btn-danger" disabled={!reason.trim() || !!busy} onClick={() => void act("Reject", reason)}>
                  Send back for rework
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              {job.actions.map((a) =>
                a.action === "Reject" ? (
                  <button key={a.action} className="btn-secondary" onClick={() => setRejecting(true)}>
                    Reject
                  </button>
                ) : (
                  <button key={a.action} className="btn-primary" disabled={!!busy} onClick={() => void act(a.action)}>
                    {busy === a.action ? "Saving…" : a.action === "Accept" ? "Accept the work" : a.action}
                  </button>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {job.rejection_reason && job.status === "Rework" && <p className="card text-sm">Sent back for rework: {job.rejection_reason}</p>}
      {job.signed_off && (
        <p className="card text-sm">
          Signed off by {job.signed_off.by}, {dateTime(job.signed_off.at)}.
        </p>
      )}

      <section className="card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Work done</h2>
          <a className="text-sm text-brand underline" href={portal.jobCardUrl(job.id)} data-testid="job-card">
            Download job card (PDF)
          </a>
        </div>
        {job.visits.length === 0 ? (
          <p className="text-sm text-slate-500">No visits yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {job.visits.map((v) => (
              <li key={v.id} className="py-3 text-sm">
                <div className="flex justify-between">
                  <span>{dateTime(v.started_at)}</span>
                  <span className="text-slate-500">{v.status === "Open" ? "On site now" : `${v.hours.toFixed(2)} hours`}</span>
                </div>
                {v.parts.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-600">
                    <span>
                      {p.item.name} × {p.qty}
                    </span>
                    <span>{money(p.amount)}</span>
                  </div>
                ))}
                {v.notes && <p className="mt-1 text-slate-600">{v.notes}</p>}
                {v.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.photos.map((ph) => (
                      // The session cookie travels with <img>, and Frappe checks the visit is yours.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={ph.id} src={ph.url} alt={ph.name} className="h-20 w-20 rounded object-cover" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-slate-600">
          {job.total_hours.toFixed(2)} hours · parts {money(job.parts_total)}
        </p>
      </section>
    </div>
  );
}
