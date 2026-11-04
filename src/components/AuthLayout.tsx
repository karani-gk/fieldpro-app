// The frame around every sign-in screen: the form on the right, and on wide screens a panel that
// says what fieldpro is. On a phone only the form shows, with the logo above it.

import { COURSE_URL, CourseNote, Logo } from "./Brand";
import { Check } from "./icons";

const POINTS = ["Works offline, syncs once", "Live job updates", "Draft invoices in ERPNext"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/50 blur-3xl" />
        <div className="relative">
          <Logo tone="light" />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Field service,
            <br />
            from booking to invoice.
          </h2>
          <ul className="mt-8 space-y-3 text-slate-300">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-mint/15 text-mint">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <a href={COURSE_URL} className="relative block rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mint">Learn to build it</p>
          <p className="mt-1 font-semibold">ERPNext as a Platform</p>
          <p className="mt-1 text-sm text-slate-400">26 lessons that build this exact system, from the data model to the app.</p>
        </a>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <div className="mt-10 lg:hidden">
          <CourseNote />
        </div>
      </main>
    </div>
  );
}
