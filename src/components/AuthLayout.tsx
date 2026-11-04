// The frame around every sign-in screen. The form stays plain on the left; the right shows the app
// itself (AuthShowcase), so the page says what you are signing in to. On a phone the picture
// gives way to a short dark band with the headline.

import AuthShowcase, { headline, type Showcase } from "./AuthShowcase";
import { CourseNote, Logo } from "./Brand";

export default function AuthLayout({ showcase, children }: { showcase: Showcase; children: React.ReactNode }) {
  const { title, text } = headline(showcase);
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col">
        <header className="relative overflow-hidden bg-ink px-6 pb-16 pt-6 text-white lg:bg-transparent lg:px-12 lg:pb-0 lg:pt-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/50 blur-3xl lg:hidden" />
          <div className="relative">
            <span className="lg:hidden">
              <Logo tone="light" />
            </span>
            <span className="hidden lg:inline">
              <Logo />
            </span>
          </div>
          <div className="relative mt-8 lg:hidden">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-slate-300">{text}</p>
          </div>
        </header>
        <main className="-mt-8 flex flex-1 items-start justify-center px-4 lg:mt-0 lg:items-center lg:px-12">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-lift ring-1 ring-black/5 lg:p-0 lg:shadow-none lg:ring-0 motion-safe:animate-rise">{children}</div>
        </main>
        <footer className="px-6 py-8 lg:px-12">
          <CourseNote />
        </footer>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(127,211,176,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-mint/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[68%]">
          <AuthShowcase showcase={showcase} />
        </div>
        <div className="absolute inset-x-12 bottom-12 text-white">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">{title}</h2>
          <p className="mt-3 max-w-md text-lg text-slate-300">{text}</p>
        </div>
      </aside>
    </div>
  );
}
