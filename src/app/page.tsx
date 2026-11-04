// Fetched on the server (a server component): the browser gets finished HTML with the company
// name in it. Signed-in screens (/tech, /portal) fetch in the browser instead, with the user's
// token or cookie, which the Next.js server never sees.
//
// This page is also the front door for people deciding whether to learn how fieldpro is built,
// so it shows the product first and the course that teaches it second.

import Link from "next/link";
import { COURSE_URL, Logo } from "@/components/Brand";
import { Arrow, Bolt, Building, Chart, Check, CloudOff, Flow, Pen, Play, Plug, Receipt, Shield, Wrench } from "@/components/icons";
import { serverInfo } from "@/lib/api";

// Desk is served by Frappe itself, not through this app. Set NEXT_PUBLIC_DESK_URL when it lives elsewhere.
const DESK_URL = `${process.env.NEXT_PUBLIC_DESK_URL ?? "http://localhost:8030"}/app/service-job`;

const FEATURES = [
  { icon: CloudOff, title: "Works with no signal", text: "Technicians keep working offline. Every change waits in an outbox and syncs once, however often it is sent." },
  { icon: Bolt, title: "Live everywhere", text: "Customers watch a job move in real time over socket.io, with optional web push to the phone." },
  { icon: Flow, title: "Workflow approvals", text: "A Frappe Workflow drives every job: small jobs go to sign-off, big ones to a manager first." },
  { icon: Pen, title: "Photos and signatures", text: "Before and after photos, the customer's signature on the glass, and a job card PDF." },
  { icon: Receipt, title: "Invoices write themselves", text: "Every finished job becomes a draft ERPNext Sales Invoice, with parts taken from the van's stock." },
  { icon: Shield, title: "Row-level security", text: "A technician sees only their jobs; a customer only their company's. Enforced on the server." },
  { icon: Plug, title: "A real API", text: "Versioned REST, one error format, cursor pagination, OAuth2 for partners and signed webhooks." },
  { icon: Chart, title: "Reports in Desk", text: "Managers assign, approve and track technician performance in ERPNext, where the business already works." },
];

const LEARN = [
  "Design a Frappe data model an API can live with",
  "Extend ERPNext without touching its code",
  "Build a versioned API with one error format",
  "Token, cookie and OAuth2 sign-in, side by side",
  "Workflows as state machines, permissions as security",
  "Offline sync, realtime, push and background jobs",
  "Webhooks in and out, PDFs, reports and tests",
  "A Next.js app any mobile client can copy",
];

export default async function Home() {
  const info = await serverInfo();
  return (
    <div className="bg-white">
      <Hero company={info?.company ?? null} />
      <Apps />
      <Features />
      <Course />
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {info ? `Connected to API v${info.api_version} · server time ${new Date(info.server_time).toUTCString()}` : "The backend is not reachable. Start it with ./start-backend.sh."}
          </p>
          <p className="flex gap-4">
            <a href="https://github.com/karani-gk/fieldpro-frappe" className="hover:text-brand">
              fieldpro-frappe
            </a>
            <a href="https://github.com/karani-gk/fieldpro-nextjs" className="hover:text-brand">
              fieldpro-nextjs
            </a>
            <span>MIT · Upeosoft</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Hero({ company }: { company: string | null }) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-brand/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-mint/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4">
        <nav className="flex items-center justify-between py-5">
          <Logo tone="light" />
          <a href={COURSE_URL} className="hidden rounded-full border border-white/15 px-4 py-1.5 text-sm text-mint transition hover:border-mint/60 hover:text-white sm:inline-flex">
            Learn to build this
          </a>
        </nav>
        <div className="grid items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-mint ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              Open source · Frappe + ERPNext v16 + Next.js
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Field service, from <span className="bg-gradient-to-r from-mint to-white bg-clip-text text-transparent">booking to invoice.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              One ERPNext backend, a technician app that works offline and a live customer portal.
              {company && (
                <>
                  {" "}
                  You are looking at <span className="font-semibold text-white">{company}</span>, the demo company.
                </>
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tech" className="btn-mint px-5 py-3 text-base">
                <Wrench className="h-5 w-5" /> Technician app
              </Link>
              <Link href="/portal" className="btn border border-white/20 px-5 py-3 text-base text-white hover:bg-white/10">
                <Building className="h-5 w-5" /> Customer portal
              </Link>
            </div>
            <a href={COURSE_URL} className="group mt-8 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-mint group-hover:bg-mint group-hover:text-ink">
                <Play className="h-3.5 w-3.5" />
              </span>
              <span>
                Watch it being built in <span className="font-semibold text-white">ERPNext as a Platform</span>
              </span>
              <Arrow className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
            </a>
          </div>
          <PhonePreview />
        </div>
      </div>
    </section>
  );
}

/** A picture of the technician app, drawn in HTML: what the visitor gets when they click. */
function PhonePreview() {
  const jobs = [
    { issue: "AC not cooling in unit 4B", who: "Kilimani Heights", status: "In Progress", tone: "bg-amber-100 text-amber-800" },
    { issue: "Vaccine fridge alarm", who: "Wanjiku Clinic", status: "Assigned", tone: "bg-indigo-100 text-indigo-800" },
    { issue: "Cold room door seal", who: "Mama Pima Supermarket", status: "Done", tone: "bg-emerald-100 text-emerald-800" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[19rem]" aria-hidden>
      <div className="absolute -inset-6 rounded-[3rem] bg-mint/10 blur-2xl" />
      <div className="relative rounded-[2.5rem] border border-white/15 bg-ink-soft p-2.5 shadow-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-slate-50 text-slate-900">
          <div className="bg-ink px-4 pb-4 pt-6 text-white">
            <p className="text-[10px] uppercase tracking-widest text-mint/80">Today</p>
            <p className="text-sm font-semibold">Achieng Odhiambo</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> All synced · live
            </p>
          </div>
          <div className="space-y-2.5 p-3">
            {jobs.map((j) => (
              <div key={j.issue} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold leading-tight">{j.issue}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${j.tone}`}>{j.status}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">{j.who}</p>
              </div>
            ))}
            <div className="rounded-xl bg-brand py-2 text-center text-[11px] font-semibold text-white">Start visit</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Apps() {
  const apps = [
    { icon: Wrench, title: "Technician app", text: "Today's jobs, visits, parts, photos and the customer's signature. Sign in with a password or a code by email.", href: "/tech", cta: "Open the app" },
    { icon: Building, title: "Customer portal", text: "Book a job, watch it move live, approve the finished work and download the job card.", href: "/portal", cta: "Open the portal" },
    { icon: Chart, title: "ERPNext Desk", text: "Managers assign technicians, approve big jobs and see performance, inside the ERP they already use.", href: DESK_URL, cta: "Open Desk" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <p className="eyebrow">Three apps, one backend</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Everyone works in the place that fits their job.</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {apps.map(({ icon: Icon, title, text, href, cta }) => (
          <a key={title} href={href} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-light text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              {cta} <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <p className="eyebrow">What is inside</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">A production system, not a to-do demo.</h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-brand" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Course() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-white shadow-lift sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/50 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mint">UPEO Academy course</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Learn to build all of it.</h2>
            <p className="mt-4 text-slate-300">
              <span className="font-semibold text-white">ERPNext as a Platform</span> walks through this exact system, one feature per lesson, so you can build
              products like it for your own clients.
            </p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <Stat value="26" label="video lessons" />
              <Stat value="8" label="modules" />
              <Stat value="1" label="certificate" />
            </div>
            <a href={COURSE_URL} className="btn-mint mt-8 px-6 py-3 text-base">
              Join the course <Arrow className="h-5 w-5" />
            </a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {LEARN.map((item) => (
              <li key={item} className="flex gap-2.5 rounded-xl bg-white/5 p-3 text-sm text-slate-200 ring-1 ring-white/10">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-extrabold text-mint">{value}</p>
      <p className="text-slate-400">{label}</p>
    </div>
  );
}
