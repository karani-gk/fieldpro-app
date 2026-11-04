// Socket.io over long-polling, through our proxy, to Frappe's socket.io server.
//
// Frappe refuses a socket whose Origin header does not name the same host as the request. A
// browser sends Origin on WebSocket handshakes and cross-site requests, but not on same-origin
// GETs, which is what long-polling is. So same-origin polling requests reach Frappe with no
// Origin and are refused ("Invalid origin").
//
// We need polling: the technician app authenticates with an Authorization header, and browsers
// cannot put headers on a WebSocket. This fills in our own Origin when the browser left it out.
// It never replaces an Origin that is there, so a request from another site still carries that
// site's Origin and Frappe still refuses it.

import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.headers.get("origin")) return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set("origin", request.nextUrl.origin);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: "/socket.io/:path*" };
