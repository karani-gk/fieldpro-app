"use client";

// Downloads the job card PDF. Building it takes the server a moment, so the button says so, and
// a failure shows a message here instead of opening a page of JSON.

import { useState } from "react";
import { portal } from "@/lib/api";
import ErrorNote from "./ErrorNote";

export default function JobCardButton({ job }: { job: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const url = URL.createObjectURL(await portal.jobCard(job));
      const link = document.createElement("a");
      link.href = url;
      link.download = `job-card-${job}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button className="btn-secondary py-1.5" onClick={() => void download()} disabled={busy} data-testid="job-card">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
        </svg>
        {busy ? "Preparing PDF…" : "Job card (PDF)"}
      </button>
      <ErrorNote error={error} />
    </div>
  );
}
