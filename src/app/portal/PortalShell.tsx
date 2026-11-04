"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortal } from "./PortalProvider";

export default function PortalShell({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/portal/login") return <div className="mx-auto max-w-md px-4 py-16">{children}</div>;
  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { session, live, signOut } = usePortal();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/portal" className="font-semibold">
            {session.customers[0]?.name ?? "Customer portal"}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className={`hidden items-center gap-1.5 sm:flex ${live ? "text-emerald-700" : "text-slate-400"}`} data-testid="live-status">
              <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} />
              {live ? "Live" : "Connecting"}
            </span>
            <Link href="/portal/book" className="btn-primary py-1.5">
              Book a job
            </Link>
            <button className="text-slate-500 underline" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
