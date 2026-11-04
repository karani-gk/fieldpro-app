"use client";

// Phone sign-in: number, then the six-digit code. The token that comes back is the technician's
// own key and secret; the app keeps it on the phone and sends it with every request.

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActivationGate from "@/components/ActivationGate";
import ErrorNote from "@/components/ErrorNote";
import { auth } from "@/lib/api";
import { saveTechAuth } from "../TechProvider";

export default function TechLogin() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setMessage((await auth.requestOtp(mobile)).message);
      setStep("code");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      saveTechAuth(await auth.verifyOtp(mobile, code));
      router.replace("/tech");
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Technician sign-in</h1>
      <ActivationGate>
        {step === "phone" ? (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="mobile">
                Mobile number
              </label>
              <input id="mobile" className="input" inputMode="tel" placeholder="0700 100001" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>
            <ErrorNote error={error} />
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Sending…" : "Send me a code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">{message}</p>
            <div>
              <label className="label" htmlFor="code">
                Six-digit code
              </label>
              <input id="code" className="input tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <ErrorNote error={error} />
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button type="button" className="w-full text-sm text-slate-500 underline" onClick={() => setStep("phone")}>
              Use another number
            </button>
            <p className="text-xs text-slate-400">Development: nothing is sent. Read the code in Desk under SMS Log.</p>
          </form>
        )}
      </ActivationGate>
    </div>
  );
}
