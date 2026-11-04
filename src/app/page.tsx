// Fetched on the server (a server component): the browser gets finished HTML with the company
// name in it. Signed-in screens (/tech, /portal) fetch in the browser instead, with the user's
// token or cookie, which the Next.js server never sees.

import Link from "next/link";
import { serverInfo } from "@/lib/api";

export default async function Home() {
  const info = await serverInfo();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">fieldpro</p>
      <h1 className="mt-2 text-3xl font-bold">{info?.company ?? "Field service"}</h1>
      <p className="mt-2 text-slate-600">From booking to invoice: one Frappe backend, a technician app and a customer portal.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/tech" className="card block transition hover:border-brand">
          <h2 className="text-lg font-semibold">Technician app</h2>
          <p className="mt-1 text-sm text-slate-600">Sign in with a code sent to your phone. Today&apos;s jobs, visits, parts, photos and sign-off, even with no signal.</p>
        </Link>
        <Link href="/portal" className="card block transition hover:border-brand">
          <h2 className="text-lg font-semibold">Customer portal</h2>
          <p className="mt-1 text-sm text-slate-600">Book a job, watch it move live, approve the finished work and download the job card.</p>
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        {info ? `Connected to API v${info.api_version} · server time ${new Date(info.server_time).toUTCString()}` : "The backend is not reachable. Start it with ./start-backend.sh."}
      </p>
      <p className="mt-1 text-xs text-slate-400">Managers work in ERPNext Desk: http://localhost:8030/app/service-job</p>
    </main>
  );
}
