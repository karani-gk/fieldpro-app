"use client";

// One job on the technician's phone. On a desktop the work sits on the left and the visits on the
// right; on a phone they stack.
//
// Work on site (start a visit, parts, end the visit) is tried online first; with no signal it
// goes into the outbox with a client_id and syncs later. Workflow steps (Complete, Sign Off) need
// the server: it owns the job's state and decides which steps exist (job.actions).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import { Check, Clock, Phone, Pin } from "@/components/icons";
import PrivateImage from "@/components/PrivateImage";
import SignaturePad from "@/components/SignaturePad";
import StatusBadge from "@/components/StatusBadge";
import type { ApiError } from "@/lib/errors";
import { dateTime, day, money, newClientId, nowIso } from "@/lib/format";
import { cachedJobs, saveJobs } from "@/lib/offline/sync";
import type { JobDetail, Op, StockLine } from "@/lib/types";
import { useTech } from "../../TechProvider";

const VAN_KEY = "fieldpro.van";
const SIGN_OFF = "Sign Off On Site";

export default function TechJob({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const { api, auth, queue, enqueue, sync, online, version, refresh } = useTech();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getJob(id)
      .then((j) => {
        if (cancelled) return;
        saveJobs(localStorage, [j]);
        setJob(j);
        setFromCache(false);
        setError(null);
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        const cached = cachedJobs(localStorage)[id];
        if (err.isOffline && cached) {
          setJob(cached);
          setFromCache(true);
        } else setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [api, id, version]);

  const pending = queue.forJob(id);
  const serverOpen = job?.visits.find((v) => v.status === "Open" && v.technician === auth.technician.id)?.id ?? null;
  const open = queue.openVisit(id, serverOpen);

  /** Try the server; with no signal, keep the work in the outbox. Either way the work is safe. */
  const doWork = useCallback(
    async (label: string, online: () => Promise<unknown>, offline: Op) => {
      setBusy(label);
      setError(null);
      try {
        await online();
        refresh();
      } catch (err) {
        if ((err as ApiError).isOffline) enqueue(offline);
        else setError(err);
      } finally {
        setBusy(null);
      }
    },
    [enqueue, refresh],
  );

  const startVisit = () => {
    const op: Op = { client_id: newClientId("visit"), op: "start_visit", job: id, at: nowIso() };
    return doWork("start", () => api.startVisit(id, op.client_id, op.at), op);
  };

  const addPart = (line: StockLine, qty: number) => {
    const op: Op = { client_id: newClientId("part"), op: "add_part", job: id, at: nowIso(), item_code: line.code, item_name: line.name, qty, ...open };
    if (!open?.visit) {
      // The visit itself is still in the outbox: the part has to wait behind it.
      enqueue(op);
      void sync();
      return;
    }
    return doWork("part", () => api.addPart(open.visit!, line.code, qty, op.client_id), op);
  };

  const endVisit = (notes: string) => {
    const op: Op = { client_id: newClientId("end"), op: "end_visit", job: id, at: nowIso(), notes, ...open };
    if (!open?.visit) {
      enqueue(op);
      void sync();
      return;
    }
    return doWork("end", () => api.endVisit(open.visit!, op.at, notes), op);
  };

  async function apply(action: string, extra: { signature?: string; signed_by?: string } = {}) {
    setBusy(action);
    setError(null);
    try {
      setJob(await api.apply(id, action, extra));
      setSigning(false);
      refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  const loadFile = useCallback((url: string) => api.privateFile(url), [api]);

  if (!job) return error ? <ErrorNote error={error} /> : <div className="h-60 animate-pulse rounded-xl bg-slate-100" />;

  const canWork = ["Assigned", "In Progress", "Rework"].includes(job.status);
  // "Start" happens by starting a visit, so the workflow button for it is not shown separately.
  const actions = job.actions.filter((a) => a.action !== "Start");

  return (
    <div className="space-y-4 lg:space-y-6">
      <Link href="/tech" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        ← Jobs
      </Link>
      {fromCache && <p className="text-xs text-slate-500">No signal: this is the job as of the last sync.</p>}

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6 lg:space-y-0 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <section className="card lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">{job.id}</p>
                <h1 className="mt-0.5 text-lg font-bold leading-snug lg:text-2xl">{job.issue}</h1>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <p className="mt-2 font-medium text-slate-800">{job.customer.name}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {job.site_address && (
                <p className="flex items-start gap-2">
                  <Pin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="whitespace-pre-line">{job.site_address}</span>
                </p>
              )}
              {job.contact_phone && (
                <a className="flex items-center gap-2 text-brand hover:underline" href={`tel:${job.contact_phone}`}>
                  <Phone className="h-4 w-4 shrink-0" />
                  {job.contact_phone}
                </a>
              )}
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                {day(job.scheduled_date)} · {job.priority}
              </p>
            </div>
            {job.description && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{job.description}</p>}
          </section>

          {(job.status === "Done" || job.status === "Cancelled") && <Finished job={job} />}

          <ErrorNote error={error} />
          {pending.length > 0 && (
            <section className="card border-amber-200 bg-amber-50" data-testid="pending">
              <p className="text-sm font-semibold text-amber-900">Waiting to sync</p>
              <ul className="mt-1 text-sm text-amber-900">
                {pending.map((op) => (
                  <li key={op.client_id}>
                    {op.op === "start_visit" && "Visit started"}
                    {op.op === "end_visit" && "Visit ended"}
                    {op.op === "add_part" && `Part: ${op.item_name ?? op.item_code} × ${op.qty}`} · {dateTime(op.at)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {canWork && !open && (
            <button className="btn-primary w-full py-3" onClick={() => void startVisit()} disabled={!!busy}>
              {busy === "start" ? "Starting…" : "Start visit"}
            </button>
          )}

          {open && <OpenVisit busy={busy} onAddPart={addPart} onEnd={endVisit} />}

          {open?.visit && online && <PhotoUpload visit={open.visit} />}

          {actions.length > 0 && (
            <section className="space-y-2">
              {!online && <p className="text-xs text-slate-500">These steps need a connection: the server checks them.</p>}
              {online && pending.length > 0 && <p className="text-xs text-slate-500">Sync your saved work first.</p>}
              {actions.map((a) => (
                <button
                  key={a.action}
                  className={a.action === SIGN_OFF ? "btn-primary w-full" : "btn-secondary w-full"}
                  disabled={!online || pending.length > 0 || !!busy}
                  onClick={() => (a.action === SIGN_OFF ? setSigning(true) : void apply(a.action))}
                >
                  {busy === a.action ? "Working…" : a.action}
                </button>
              ))}
            </section>
          )}

          {signing && <SignOff busy={busy === SIGN_OFF} onCancel={() => setSigning(false)} onSign={(signature, name) => void apply(SIGN_OFF, { signature, signed_by: name })} />}
        </div>

        <section className="lg:sticky lg:top-10">
          <h2 className="mb-2 flex items-baseline justify-between text-sm font-semibold text-slate-700">
            Visits
            <span className="text-xs font-normal text-slate-500">
              {job.total_hours.toFixed(1)} h · parts {money(job.parts_total)}
            </span>
          </h2>
          {job.visits.length === 0 && <p className="text-sm text-slate-500">No visits yet.</p>}
          <ul className="space-y-2">
            {job.visits.map((v) => (
              <li key={v.id} className="card">
                <div className="flex justify-between text-sm">
                  <span>{dateTime(v.started_at)}</span>
                  <span className="text-slate-500">{v.status === "Open" ? "Open" : `${v.hours.toFixed(2)} h`}</span>
                </div>
                {v.parts.length > 0 && (
                  <ul className="mt-2 text-sm text-slate-700">
                    {v.parts.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>
                          {p.item.name} × {p.qty}
                        </span>
                        <span>{money(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {v.notes && <p className="mt-2 text-sm text-slate-600">{v.notes}</p>}
                {v.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.photos.map((ph) => (
                      <PrivateImage key={ph.id} url={ph.url} load={loadFile} alt={ph.name} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** What a closed job ended with: who signed it off, or that it was cancelled. */
function Finished({ job }: { job: JobDetail }) {
  if (job.status === "Cancelled") {
    return <section className="card border-slate-200 bg-slate-50 text-sm text-slate-600">This job was cancelled. Nothing more to do here.</section>;
  }
  return (
    <section className="card flex items-start gap-3 border-emerald-200 bg-emerald-50/60">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
        <Check className="h-5 w-5" />
      </span>
      <div className="text-sm">
        <p className="font-semibold text-emerald-900">Job done</p>
        {job.signed_off && (
          <p className="text-emerald-800">
            Signed off by {job.signed_off.by} · {dateTime(job.signed_off.at)}
          </p>
        )}
      </div>
    </section>
  );
}

function OpenVisit({ busy, onAddPart, onEnd }: { busy: string | null; onAddPart: (line: StockLine, qty: number) => unknown; onEnd: (notes: string) => unknown }) {
  const { api, online } = useTech();
  const [stock, setStock] = useState<StockLine[]>([]);
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // The van's stock, kept for when there is no signal.
    const cached = JSON.parse(localStorage.getItem(VAN_KEY) ?? "[]") as StockLine[];
    setStock(cached);
    if (!online) return;
    api
      .vanStock()
      .then((lines) => {
        localStorage.setItem(VAN_KEY, JSON.stringify(lines));
        setStock(lines);
      })
      .catch(() => undefined);
  }, [api, online]);

  const line = stock.find((s) => s.code === code);
  return (
    <section className="card space-y-3 border-brand/40" data-testid="open-visit">
      <p className="text-sm font-semibold text-brand">Visit in progress</p>
      <div className="flex gap-2">
        <select className="input flex-1" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Part">
          <option value="">Add a part from the van…</option>
          {stock.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.in_van} in van)
            </option>
          ))}
        </select>
        <input className="input w-20" type="number" min={0.5} step={0.5} value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="Quantity" />
      </div>
      <button
        className="btn-secondary w-full"
        disabled={!line || qty <= 0 || busy === "part"}
        onClick={() => {
          if (!line) return;
          void onAddPart(line, qty);
          setCode("");
          setQty(1);
        }}
      >
        {busy === "part" ? "Adding…" : "Add part"}
      </button>
      <textarea className="input" rows={2} placeholder="What did you do?" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className="btn-primary w-full" disabled={busy === "end"} onClick={() => void onEnd(notes)}>
        {busy === "end" ? "Ending…" : "End visit"}
      </button>
    </section>
  );
}

function PhotoUpload({ visit }: { visit: string }) {
  const { api, refresh } = useTech();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <section className="card">
      <label className="label" htmlFor="photo">
        Add a photo
      </label>
      <input
        id="photo"
        type="file"
        accept="image/*"
        capture="environment"
        className="text-sm"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            setBusy(true);
            setError(null);
            try {
              await api.addPhoto(visit, file.name, String(reader.result));
              refresh();
            } catch (err) {
              setError(err);
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          };
          reader.readAsDataURL(file);
        }}
      />
      {busy && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
      <ErrorNote error={error} />
    </section>
  );
}

function SignOff({ busy, onCancel, onSign }: { busy: boolean; onCancel: () => void; onSign: (signature: string, name: string) => void }) {
  const [signature, setSignature] = useState<string | null>(null);
  const [name, setName] = useState("");
  return (
    <section className="card space-y-3" data-testid="sign-off">
      <p className="font-semibold">Customer sign-off</p>
      <p className="text-sm text-slate-600">Hand the phone to the customer to sign.</p>
      <SignaturePad onChange={setSignature} />
      <input className="input" placeholder="Customer's name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Customer's name" />
      <div className="flex gap-2">
        <button className="btn-secondary flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary flex-1" disabled={!signature || !name.trim() || busy} onClick={() => signature && onSign(signature, name.trim())}>
          {busy ? "Saving…" : "Confirm sign-off"}
        </button>
      </div>
    </section>
  );
}
