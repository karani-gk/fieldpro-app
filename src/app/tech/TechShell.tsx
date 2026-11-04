"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Calendar, List } from "@/components/icons";
import { useTech } from "./TechProvider";

export default function TechShell({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/tech/login") return <AuthLayout>{children}</AuthLayout>;
  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { auth, notice, dismissNotice, signOut } = useTech();
  const pathname = usePathname();
  const tab = (href: string, label: string, Icon: typeof List) => (
    <Link href={href} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${pathname === href ? "text-brand" : "text-slate-400 hover:text-slate-600"}`}>
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
  const initials = auth.technician.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 shadow-lift">
      <header className="sticky top-0 z-10 bg-ink px-4 pb-3 pt-4 text-white">
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
        <SyncStatus />
      </header>
      {notice && (
        <div className="flex items-start justify-between gap-2 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <span>{notice}</span>
          <button className="text-xs font-semibold underline" onClick={dismissNotice}>
            OK
          </button>
        </div>
      )}
      <main className="flex-1 px-4 py-5">{children}</main>
      <nav className="sticky bottom-0 flex border-t border-slate-200 bg-white/95 backdrop-blur">
        {tab("/tech", "Today", List)}
        {tab("/tech/week", "My week", Calendar)}
      </nav>
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
    <button onClick={() => void sync()} className={`mt-3 w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition ${tone}`} data-testid="sync-status">
      {text}
    </button>
  );
}
