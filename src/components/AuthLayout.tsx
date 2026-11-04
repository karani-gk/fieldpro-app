// The frame around every sign-in screen: one white card on the brand background, the logo above
// it and the course below. Nothing else competes with the form.

import { CourseNote, Logo } from "./Brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-mint/10 blur-3xl" />
      <div className="relative mb-8">
        <Logo tone="light" />
      </div>
      <main className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-black/5">{children}</main>
      <div className="relative mt-8">
        <CourseNote tone="light" />
      </div>
    </div>
  );
}
