"use client";

// Any screen that crashes lands here instead of a blank page. The error goes to the console with
// its digest, which matches the line in the server log.

import { useEffect } from "react";
import { Logo } from "@/components/Brand";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("fieldpro screen error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <h1 className="mt-10 text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-slate-600">Your work is safe. Try again, and if it keeps happening, tell your administrator.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Reference: {error.digest}</p>}
      <button className="btn-primary mt-8" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
