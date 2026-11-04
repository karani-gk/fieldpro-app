// The picture beside each sign-in form: pieces of the real app, floating over the brand colours.
// Drawn in HTML so it stays sharp and needs no image files. Purely decorative (aria-hidden).

import { Check } from "./icons";

export type Showcase = "tech" | "portal" | "activate";

const HEADLINES: Record<Showcase, { title: string; text: string }> = {
  tech: { title: "Your day, in your pocket.", text: "Jobs, parts, photos and signatures, even with no signal." },
  portal: { title: "See every job, live.", text: "Book work, watch it move and approve it when it is done." },
  activate: { title: "One code. Everything on.", text: "Activate once, and every technician, customer and manager can sign in." },
};

export function headline(showcase: Showcase) {
  return HEADLINES[showcase];
}

/** A floating card. `delay` staggers the entrance and the float so the pieces never move as one. */
function Piece({ className = "", delay = 0, slow = false, children }: { className?: string; delay?: number; slow?: boolean; children: React.ReactNode }) {
  return (
    <div className={`absolute motion-safe:animate-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div className={slow ? "motion-safe:animate-float-slow" : "motion-safe:animate-float"} style={{ animationDelay: `${delay * 2}ms` }}>
        {children}
      </div>
    </div>
  );
}

const glass = "rounded-2xl bg-white/95 p-4 text-slate-900 shadow-2xl ring-1 ring-black/5";
const chip = "rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur";

function TechScene() {
  return (
    <>
      <Piece className="left-[8%] top-[10%] w-72" delay={100}>
        <div className={glass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">AC not cooling in unit 4B</p>
              <p className="mt-0.5 text-xs text-slate-500">Kilimani Heights · 10:30</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">In Progress</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <span className="rounded-lg bg-slate-50 px-2 py-1.5">Run capacitor × 1</span>
            <span className="rounded-lg bg-slate-50 px-2 py-1.5">R134a gas × 1</span>
          </div>
          <div className="mt-3 rounded-lg bg-brand py-2 text-center text-xs font-semibold text-white">End visit</div>
        </div>
      </Piece>
      <Piece className="right-[8%] top-[34%]" delay={350} slow>
        <div className={chip}>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-300" />3 changes synced
        </div>
      </Piece>
      <Piece className="bottom-[16%] left-[18%] w-60" delay={600}>
        <div className={glass}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Customer sign-off</p>
          <svg viewBox="0 0 200 50" className="mt-1 h-12 w-full text-ink" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
            <path d="M8 34c10-18 18-22 22-12s-6 18 2 12 14-24 22-20-4 22 6 18 12-16 20-14 2 14 10 12 16-10 24-8 8 6 16 4 20-6 28-6" />
          </svg>
          <p className="text-xs text-slate-500">Grace Wanjiku · signed 11:42</p>
        </div>
      </Piece>
      <Piece className="right-[12%] top-[8%]" delay={800} slow>
        <div className={chip}>Visit started 09:12</div>
      </Piece>
    </>
  );
}

function PortalScene() {
  const steps = ["Booked", "Assigned", "In progress", "Done"];
  return (
    <>
      <Piece className="left-[8%] top-[12%] w-80" delay={100}>
        <div className={glass}>
          <p className="text-xs text-slate-400">JOB-2026-00014</p>
          <p className="text-sm font-semibold">Vaccine fridge alarm</p>
          <ol className="mt-4 flex items-center">
            {steps.map((step, i) => (
              <li key={step} className="flex flex-1 flex-col items-center gap-1.5 text-[10px] text-slate-500">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-white ${i < 3 ? "bg-brand" : "bg-slate-200"}`}>
                  {i < 2 ? <Check className="h-3.5 w-3.5" /> : i === 2 ? <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> : null}
                </span>
                <span className={i === 2 ? "font-semibold text-brand" : ""}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Piece>
      <Piece className="right-[6%] top-[40%] w-64" delay={400} slow>
        <div className="rounded-2xl bg-ink-soft/90 p-4 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
          <p className="flex items-center gap-2 text-xs font-semibold text-mint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            Live
          </p>
          <p className="mt-1 text-sm">Achieng started the visit</p>
          <p className="text-xs text-slate-400">just now</p>
        </div>
      </Piece>
      <Piece className="bottom-[14%] left-[14%] w-56" delay={700}>
        <div className={`${glass} flex items-center gap-3`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-[10px] font-bold text-rose-600">PDF</span>
          <div>
            <p className="text-sm font-semibold">Job card</p>
            <p className="text-xs text-slate-500">Parts KES 2,850</p>
          </div>
        </div>
      </Piece>
    </>
  );
}

function ActivateScene() {
  return (
    <>
      <Piece className="left-[10%] top-[20%] w-80" delay={100}>
        <div className={glass}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Access code</p>
          <p className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">UA1.eyJjb3Vyc2UiOi••••••••</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100">
              <Check className="h-3.5 w-3.5" />
            </span>
            Signed by UPEO Academy
          </p>
        </div>
      </Piece>
      <Piece className="bottom-[22%] right-[10%]" delay={500} slow>
        <div className={chip}>Activated once, for everyone</div>
      </Piece>
    </>
  );
}

const SCENES: Record<Showcase, () => React.ReactNode> = { tech: TechScene, portal: PortalScene, activate: ActivateScene };

export default function AuthShowcase({ showcase }: { showcase: Showcase }) {
  const Scene = SCENES[showcase];
  return (
    <div className="relative h-full w-full" aria-hidden>
      <Scene />
    </div>
  );
}
