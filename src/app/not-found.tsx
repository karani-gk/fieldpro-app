import Link from "next/link";
import { Logo } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-slate-600">The link may be old, or the job may have been removed.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/tech" className="btn-primary">
          Technician app
        </Link>
        <Link href="/portal" className="btn-secondary">
          Customer portal
        </Link>
      </div>
    </main>
  );
}
