// The fieldpro mark and the one place the course link lives.

import Link from "next/link";

export const COURSE_URL = "https://www.upeo.academy/courses/erpnext-as-platform-course";

export function Logo({ tone = "dark", href = "/" }: { tone?: "dark" | "light"; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-ink text-mint shadow-soft">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
        </svg>
      </span>
      <span className={tone === "light" ? "text-white" : "text-ink"}>
        field<span className="text-brand">pro</span>
      </span>
    </Link>
  );
}

/** A quiet line on every screen: this app is what the course builds. */
export function CourseNote({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <p className={`text-center text-xs ${tone === "light" ? "text-mint/80" : "text-slate-500"}`}>
      Built lesson by lesson in{" "}
      <a href={COURSE_URL} className={`font-semibold underline-offset-2 hover:underline ${tone === "light" ? "text-white" : "text-brand"}`}>
        ERPNext as a Platform
      </a>
    </p>
  );
}
