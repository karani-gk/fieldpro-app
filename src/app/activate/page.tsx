"use client";

// Once per installation: the access code from the course email activates fieldpro for everyone.
// The code is checked on the backend (fieldpro/services/activation.py), not here.

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import ErrorNote from "@/components/ErrorNote";
import { activation } from "@/lib/api";
import type { ActivationStatus } from "@/lib/types";

export default function ActivatePage() {
  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    activation.status().then(setStatus).catch(setError);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setStatus(await activation.activate(code));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold tracking-tight">Activate fieldpro</h1>
      {status?.activated ? (
        <div className="mt-6 space-y-3 text-sm">
          <p>This installation is activated. Everyone can sign in now.</p>
          <p className="grid gap-2 sm:grid-cols-2">
            <Link href="/tech/login" className="btn-primary">
              Technician sign-in
            </Link>
            <Link href="/portal/login" className="btn-secondary">
              Customer portal
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">Enter the access code from your course email. You only do this once.</p>
          <div>
            <label className="label" htmlFor="code">
              Access code
            </label>
            <textarea id="code" className="input font-mono text-xs" rows={4} placeholder="UA1...." value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <ErrorNote error={error} />
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? "Checking…" : "Activate"}
          </button>
          {status && (
            <p className="text-xs text-slate-500">
              No code yet? It comes by email when you join{" "}
              <a href={status.course_url} className="underline">
                ERPNext as a Platform
              </a>{" "}
              at UPEO Academy.
            </p>
          )}
        </form>
      )}
    </AuthLayout>
  );
}
