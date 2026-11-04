"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTech } from "./TechProvider";

export default function TechShell({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/tech/login") return <div className="mx-auto max-w-md px-4 py-10">{children}</div>;
  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { auth, notice, dismissNotice, signOut } = useTech();
  const pathname = usePathname();
  const tab = (href: string, label: string) => (
    <Link href={href} className={`flex-1 py-3 text-center text-sm font-medium ${pathname === href ? "text-brand" : "text-slate-500"}`}>
      {label}
    </Link>
  );
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-sm">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">fieldpro</p>
            <p className="font-semibold">{auth.technician.name}</p>
          </div>
          <button className="text-xs text-slate-500 underline" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <SyncStatus />
      </header>
      {notice && (
        <div className="flex items-start justify-between gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <span>{notice}</span>
          <button className="text-xs underline" onClick={dismissNotice}>
            OK
          </button>
        </div>
      )}
      <main className="flex-1 px-4 py-4">{children}</main>
      <nav className="sticky bottom-0 flex border-t border-slate-200 bg-white">
        {tab("/tech", "Today")}
        {tab("/tech/week", "My week")}
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
    tone = "bg-slate-800 text-white";
  } else if (syncing) {
    text = "Syncing…";
    tone = "bg-sky-100 text-sky-900";
  } else if (pending) {
    text = `${pending} change${pending === 1 ? "" : "s"} waiting to sync`;
    tone = "bg-amber-100 text-amber-900";
  } else {
    text = live ? "All synced · live" : "All synced";
    tone = "bg-emerald-50 text-emerald-800";
  }
  return (
    <button onClick={() => void sync()} className={`mt-2 w-full rounded-md px-3 py-1.5 text-left text-xs font-medium ${tone}`} data-testid="sync-status">
      {text}
    </button>
  );
}
