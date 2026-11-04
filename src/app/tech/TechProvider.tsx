"use client";

// Everything the technician screens share: the signed-in technician, their API client, whether we
// are online, the outbox of offline work, background sync and live updates.

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { techApi, type TechApi } from "@/lib/api";
import { OpQueue } from "@/lib/offline/queue";
import { forgetEverything, syncNow, type SyncReport } from "@/lib/offline/sync";
import { setUpPush, type PushState } from "@/lib/push";
import { subscribeToJobs } from "@/lib/realtime";
import type { Op } from "@/lib/types";

const AUTH_KEY = "fieldpro.tech";
const SYNC_EVERY_MS = 60_000;

export interface TechAuth {
  token: string;
  user: string;
  technician: { id: string; name: string };
}

interface TechContextValue {
  auth: TechAuth;
  api: TechApi;
  online: boolean;
  live: boolean;
  syncing: boolean;
  pending: number;
  lastSync: SyncReport | null;
  push: PushState | null;
  notice: string | null;
  /** Bumped whenever something changed (a sync, a live update): screens reload when it moves. */
  version: number;
  queue: OpQueue;
  enqueue: (op: Op) => void;
  sync: () => Promise<void>;
  refresh: () => void;
  signOut: () => Promise<void>;
  dismissNotice: () => void;
}

const TechContext = createContext<TechContextValue | null>(null);

export function saveTechAuth(auth: TechAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function loadTechAuth(): TechAuth | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function useTech(): TechContextValue {
  const value = useContext(TechContext);
  if (!value) throw new Error("useTech is used outside TechProvider");
  return value;
}

export default function TechProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === "/tech/login";
  const [auth, setAuth] = useState<TechAuth | null | undefined>(undefined);

  useEffect(() => {
    const stored = loadTechAuth();
    setAuth(stored);
    if (!stored && !onLogin) router.replace("/tech/login");
  }, [onLogin, router]);

  if (onLogin) return <>{children}</>;
  if (!auth) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  return <SignedIn auth={auth}>{children}</SignedIn>;
}

function SignedIn({ auth, children }: { auth: TechAuth; children: React.ReactNode }) {
  const router = useRouter();
  const api = useMemo(() => techApi(auth.token), [auth.token]);
  const queue = useMemo(() => new OpQueue(localStorage), []);
  const [online, setOnline] = useState(true);
  const [live, setLive] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [lastSync, setLastSync] = useState<SyncReport | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const running = useRef(false);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const signOut = useCallback(async () => {
    // Signed out on this phone whatever happens; a token the server could not revoke is logged.
    await api.signOut().catch((error) => console.error("Technician sign-out: the server did not revoke the token", error));
    localStorage.removeItem(AUTH_KEY);
    forgetEverything(localStorage);
    router.replace("/tech/login");
  }, [api, router]);

  const sync = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setSyncing(true);
    try {
      const report = await syncNow(api, queue, localStorage);
      setLastSync(report);
      setOnline(!report.offline);
      if (report.conflicts.length || report.failed.length) {
        setNotice(
          [...report.conflicts, ...report.failed]
            .map((r) => r.error?.message ?? "A change was not accepted.")
            .join(" "),
        );
      }
      refresh();
    } catch (error) {
      const e = error as { code?: string };
      // The token was revoked (signed in on another phone): sign out here too.
      if (e.code === "unauthorized" || e.code === "forbidden") await signOut();
    } finally {
      setPending(queue.size);
      setSyncing(false);
      running.current = false;
    }
  }, [api, queue, refresh, signOut]);

  const enqueue = useCallback(
    (op: Op) => {
      queue.add(op);
      setPending(queue.size);
      refresh();
    },
    [queue, refresh],
  );

  useEffect(() => {
    setOnline(navigator.onLine);
    setPending(queue.size);
    const goOnline = () => {
      setOnline(true);
      void sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const timer = window.setInterval(() => void sync(), SYNC_EVERY_MS);
    void sync();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.clearInterval(timer);
    };
  }, [queue, sync]);

  useEffect(() => subscribeToJobs(auth.token, () => refresh(), setLive), [auth.token, refresh]);

  useEffect(() => {
    setUpPush(api, (title, body) => setNotice(`${title}: ${body}`))
      .then(setPush)
      .catch(() => setPush("unsupported"));
  }, [api]);

  const value: TechContextValue = {
    auth,
    api,
    online,
    live,
    syncing,
    pending,
    lastSync,
    push,
    notice,
    version,
    queue,
    enqueue,
    sync,
    refresh,
    signOut,
    dismissNotice: () => setNotice(null),
  };
  return <TechContext.Provider value={value}>{children}</TechContext.Provider>;
}
