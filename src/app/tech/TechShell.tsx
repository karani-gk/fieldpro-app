"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Calendar, List, SignOut, Wrench } from "@/components/icons";
import { useTech } from "./TechProvider";

export default function TechShell({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/tech/login") return <AuthLayout showcase="tech">{children}</AuthLayout>;
  return <SignedInShell>{children}</SignedInShell>;
}

// A phone gets the app it was built as: header on top, tabs at the bottom. A desktop (lg and up)
// gets a sidebar and the full width, so the same screens are comfortable on a big monitor.
const NAV = [
  { href: "/tech", label: "Jobs", Icon: List },
  { href: "/tech/week", label: "My week", Icon: Calendar },
];

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { auth, notice, dismissNotice, signOut } = useTech();
  const pathname = usePathname();
  const active = (href: string) => (href === "/tech" ? pathname === "/tech" || pathname.startsWith("/tech/jobs") : pathname === href);
  const initials = auth.technician.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 bg-ink px-4 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-mint/80">fieldpro</p>
            <p className="font-semibold leading-tight">Technician</p>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active(href) ? "bg-white/10 text-white shadow-[inset_3px_0_0_theme(colors.mint.DEFAULT)]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <SyncStatus />
          <div className="flex items-center gap-3 border-t border-white/10 px-2 pt-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-mint to-brand text-sm font-bold text-ink">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{auth.technician.name}</p>
              <p className="text-xs text-slate-400">Technician</p>
            </div>
            <button className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={() => void signOut()} title="Sign out" aria-label="Sign out">
              <SignOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 shadow-lift lg:max-w-none lg:shadow-none">
        <header className="sticky top-0 z-10 bg-ink px-4 pb-3 pt-4 text-white lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-mint to-brand text-sm font-bold text-ink">{initials}</span>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-mint/80">fieldpro</p>
                <p className="font-semibold leading-tight">{auth.technician.name}</p>
              </div>
            </div>
            <button className="rounded-full px-3 py-1.5 text-xs text-slate-300 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
          <div className="mt-3">
            <SyncStatus />
          </div>
        </header>
        {notice && (
          <div className="flex items-start justify-between gap-2 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 lg:px-10">
            <span>{notice}</span>
            <button className="text-xs font-semibold underline" onClick={dismissNotice}>
              OK
            </button>
          </div>
        )}
        <main className="w-full flex-1 px-4 py-5 lg:mx-auto lg:max-w-6xl lg:px-10 lg:py-10">{children}</main>
        <nav className="sticky bottom-0 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${active(href) ? "text-brand" : "text-slate-400 hover:text-slate-600"}`}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** What the technician needs to trust the app with no signal: is my work saved, and is it sent? */
function SyncStatus() {
  const { online, syncing, pending, live, sync } = useTech();
  let text: string;
  let tone: string;
  if (!online) {
    text = pending ? `Offline - ${pending} change${pending === 1 ? "" : "s"} saved on this phone` : "Offline - your work is saved on this phone";
    tone = "bg-white/10 text-white ring-1 ring-white/20";
  } else if (syncing) {
    text = "Syncing…";
    tone = "bg-sky-400/15 text-sky-100";
  } else if (pending) {
    text = `${pending} change${pending === 1 ? "" : "s"} waiting to sync`;
    tone = "bg-amber-400/20 text-amber-100";
  } else {
    text = live ? "All synced · live" : "All synced";
    tone = "bg-emerald-400/15 text-emerald-100";
  }
  return (
    <button onClick={() => void sync()} className={`w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition ${tone}`} data-testid="sync-status">
      {text}
    </button>
  );
}
