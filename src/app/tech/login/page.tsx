"use client";

// Two ways in, one result: a password, or a six-digit code sent to the technician (by email by
// default). Either way the token that comes back is the technician's own key and secret; the app
// keeps it on the phone and sends it with every request.

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActivationGate from "@/components/ActivationGate";
import ErrorNote from "@/components/ErrorNote";
import { auth } from "@/lib/api";
import { saveTechAuth } from "../TechProvider";

type Method = "password" | "code";

export default function TechLogin() {
  const [method, setMethod] = useState<Method>("password");
  return (
    <div>
      <p className="eyebrow">Technician app</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in to see today&apos;s jobs.</p>
      <ActivationGate>
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm" role="tablist">
          {(["password", "code"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={method === m}
              onClick={() => setMethod(m)}
              className={`rounded-lg py-2 font-medium transition ${method === m ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {m === "password" ? "Password" : "Sign-in code"}
            </button>
          ))}
        </div>
        {method === "password" ? <PasswordForm /> : <CodeForm />}
      </ActivationGate>
    </div>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      saveTechAuth(await auth.signInWithPassword(login, password));
      router.replace("/tech");
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="login">
          Email or mobile number
        </label>
        <input id="login" className="input" autoComplete="username" placeholder="achieng@fieldpro.test" value={login} onChange={(e) => setLogin(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <ErrorNote error={error} />
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function CodeForm() {
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

  return step === "phone" ? (
    <form onSubmit={sendCode} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="mobile">
          Mobile number
        </label>
        <input id="mobile" className="input" inputMode="tel" placeholder="0700 100001" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
      </div>
      <ErrorNote error={error} />
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? "Sending…" : "Send me a code"}
      </button>
    </form>
  ) : (
    <form onSubmit={verify} className="mt-6 space-y-4">
      <p className="rounded-xl bg-brand-light/60 px-3 py-2 text-sm text-brand-dark">{message}</p>
      <div>
        <label className="label" htmlFor="code">
          Six-digit code
        </label>
        <input
          id="code"
          className="input text-center text-lg font-semibold tracking-[0.5em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <ErrorNote error={error} />
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </button>
      <button type="button" className="w-full text-sm text-slate-500 underline-offset-2 hover:underline" onClick={() => setStep("phone")}>
        Use another number
      </button>
      <p className="text-center text-xs text-slate-400">Development: nothing is sent. Read the code in Desk under SMS Log.</p>
    </form>
  );
}
