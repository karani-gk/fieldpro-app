// Live job updates from Frappe's socket.io server (the backend's services/realtime.py).
//
// The socket connects to this app's own origin; next.config.mjs proxies /socket.io to the backend.
// The namespace is the Frappe site name. The portal is recognised by its session cookie, the
// technician app by its token header. Both join their user's room, which is where the backend
// publishes "fieldpro_job" for the jobs they may see.
//
// Long-polling only: the Next.js dev proxy does not pass WebSocket upgrades. In production, put a
// reverse proxy (nginx) in front and allow ["websocket", "polling"].

import { io, type Socket } from "socket.io-client";

export interface JobEvent {
  id: string;
  status: string;
  technician: string | null;
  updated_at: string;
}

const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "fieldpro.localhost";

export function subscribeToJobs(token: string | null, onEvent: (event: JobEvent) => void, onStatus?: (live: boolean) => void): () => void {
  const socket: Socket = io(`${window.location.origin}/${SITE}`, {
    path: "/socket.io",
    transports: ["polling"],
    withCredentials: !token,
    extraHeaders: token ? { Authorization: `token ${token}` } : undefined,
  });
  socket.on("fieldpro_job", onEvent);
  socket.on("connect", () => onStatus?.(true));
  socket.on("disconnect", () => onStatus?.(false));
  socket.on("connect_error", (error) => {
    // Visible in the browser console: "Invalid origin", "Unauthorized: ..." name the cause.
    console.warn("fieldpro live updates:", error.message);
    onStatus?.(false);
  });
  return () => {
    socket.off("fieldpro_job", onEvent);
    socket.disconnect();
  };
}
