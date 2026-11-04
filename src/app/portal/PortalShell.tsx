"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { CourseNote, Logo } from "@/components/Brand";
import { usePortal } from "./PortalProvider";

export default function PortalShell({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/portal/login") return <AuthLayout showcase="portal">{children}</AuthLayout>;
  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { session, live, signOut } = usePortal();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href="/portal" />
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <span className="hidden truncate text-sm font-medium text-slate-600 sm:block">{session.customers[0]?.name ?? "Customer portal"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:flex ${live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              data-testid="live-status"
            >
              <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-slate-300"}`} />
              {live ? "Live" : "Connecting"}
            </span>
            <Link href="/portal/book" className="btn-primary py-2">
              Book a job
            </Link>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-mint to-brand text-xs font-bold text-ink" title={session.full_name}>
                {initials(session.full_name)}
              </span>
              <span className="hidden text-sm font-medium text-slate-700 md:block">{session.full_name}</span>
              <button className="ml-1 text-slate-500 hover:text-slate-800" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 py-6">
        <CourseNote />
      </footer>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
