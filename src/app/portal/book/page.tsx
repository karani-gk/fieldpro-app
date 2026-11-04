"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import { portal } from "@/lib/api";

export default function BookJob() {
  const router = useRouter();
  const [form, setForm] = useState({ issue: "", description: "", site_address: "", contact_phone: "", preferred_date: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [field]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const job = await portal.bookJob(form);
      router.push(`/portal/jobs/${job.id}`);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Book a job</h1>
      <div>
        <label className="label" htmlFor="issue">
          What is wrong?
        </label>
        <input id="issue" className="input" placeholder="Fridge not cooling" value={form.issue} onChange={set("issue")} required maxLength={140} />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Details
        </label>
        <textarea id="description" className="input" rows={3} value={form.description} onChange={set("description")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="site">
            Where?
          </label>
          <input id="site" className="input" value={form.site_address} onChange={set("site_address")} />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone on site
          </label>
          <input id="phone" className="input" inputMode="tel" value={form.contact_phone} onChange={set("contact_phone")} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="date">
          Preferred date
        </label>
        <input id="date" type="date" className="input" value={form.preferred_date} onChange={set("preferred_date")} />
      </div>
      <ErrorNote error={error} />
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Booking…" : "Book the job"}
      </button>
    </form>
  );
}
