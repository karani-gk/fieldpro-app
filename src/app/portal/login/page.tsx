"use client";

// Browser sign-in: Frappe's /api/method/login sets the session cookie. From then on the browser
// sends the cookie by itself, and api.ts adds the CSRF token to every POST.

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActivationGate from "@/components/ActivationGate";
import ErrorNote from "@/components/ErrorNote";
import { portal } from "@/lib/api";
import { ApiError } from "@/lib/errors";

export default function PortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await portal.login(email, password);
      if (session.kind !== "customer") {
        await portal.logout();
        throw new ApiError(403, "forbidden", "This sign-in is for customers. Staff use ERPNext Desk; technicians use the technician app.");
      }
      router.replace("/portal");
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Customer portal</p>
      <ActivationGate>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <ErrorNote error={error} />
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </ActivationGate>
    </div>
  );
}
