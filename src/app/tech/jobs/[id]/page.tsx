"use client";

// One job on the technician's phone.
//
// Work on site (start a visit, parts, end the visit) is tried online first; with no signal it
// goes into the outbox with a client_id and syncs later. Workflow steps (Complete, Sign Off) need
// the server: it owns the job's state and decides which steps exist (job.actions).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
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
    <div className="space-y-4">
      <Link href="/tech" className="text-sm text-slate-500">
        ← Today
      </Link>
      {fromCache && <p className="text-xs text-slate-500">No signal: this is the job as of the last sync.</p>}

      <section className="card">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold">{job.issue}</h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="mt-1 text-sm">{job.customer.name}</p>
        <p className="text-sm text-slate-600">{job.site_address}</p>
        {job.contact_phone && (
          <a className="text-sm text-brand underline" href={`tel:${job.contact_phone}`}>
            {job.contact_phone}
          </a>
        )}
        {job.description && <p className="mt-2 text-sm text-slate-700">{job.description}</p>}
        <p className="mt-2 text-xs text-slate-500">
          {job.id} · {day(job.scheduled_date)} · {job.priority}
        </p>
      </section>

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

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Visits</h2>
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
