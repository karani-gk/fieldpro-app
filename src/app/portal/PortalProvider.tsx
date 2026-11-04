"use client";

// The customer portal's session: Frappe's cookie, checked with auth.session. Live updates come
// over socket.io, authenticated by the same cookie.

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { portal } from "@/lib/api";
import { subscribeToJobs, type JobEvent } from "@/lib/realtime";
import type { Session } from "@/lib/types";

interface PortalContextValue {
  session: Session;
  live: boolean;
  version: number;
  lastEvent: JobEvent | null;
  refresh: () => void;
  signOut: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function usePortal(): PortalContextValue {
  const value = useContext(PortalContext);
  if (!value) throw new Error("usePortal is used outside PortalProvider");
  return value;
}

export default function PortalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === "/portal/login";
  const [session, setSession] = useState<Session | null>(null);
  const [live, setLive] = useState(false);
  const [version, setVersion] = useState(0);
  const [lastEvent, setLastEvent] = useState<JobEvent | null>(null);

  useEffect(() => {
    if (onLogin) return;
    portal
      .session()
      .then((s) => {
        if (s.kind !== "customer") router.replace("/portal/login");
        else setSession(s);
      })
      .catch(() => router.replace("/portal/login"));
  }, [onLogin, router]);

  useEffect(() => {
    if (!session) return;
    return subscribeToJobs(
      null,
      (event) => {
        setLastEvent(event);
        setVersion((v) => v + 1);
      },
      setLive,
    );
  }, [session]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const signOut = useCallback(async () => {
    await portal.logout();
    setSession(null);
    router.replace("/portal/login");
  }, [router]);

  if (onLogin) return <>{children}</>;
  if (!session) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  return <PortalContext.Provider value={{ session, live, version, lastEvent, refresh, signOut }}>{children}</PortalContext.Provider>;
}
