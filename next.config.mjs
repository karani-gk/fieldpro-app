/**
 * The browser only ever talks to this app's origin. Requests for the backend are proxied:
 *
 *   /api/*          -> Frappe (REST and whitelisted methods)
 *   /private/files  -> Frappe (photos, signatures; Frappe checks permission)
 *   /socket.io/*    -> Frappe's socket.io server (live job updates)
 *
 * One origin means the session cookie is first-party, there is no CORS to configure, and the
 * backend's address can change without touching client code.
 */
const FRAPPE_URL = process.env.FRAPPE_URL ?? "http://127.0.0.1:8030";
// Socket.io checks that Host and Origin name the same machine; the browser's Origin says
// "localhost", so the proxy must reach socket.io as "localhost" too, not 127.0.0.1.
const SOCKETIO_URL = process.env.SOCKETIO_URL ?? "http://localhost:9030";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Socket.io's path is "/socket.io/" with the slash; Next.js would redirect it to "/socket.io".
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${FRAPPE_URL}/api/:path*` },
      { source: "/private/files/:path*", destination: `${FRAPPE_URL}/private/files/:path*` },
      { source: "/files/:path*", destination: `${FRAPPE_URL}/files/:path*` },
      { source: "/socket.io/", destination: `${SOCKETIO_URL}/socket.io/` },
      { source: "/socket.io/:path+", destination: `${SOCKETIO_URL}/socket.io/:path+` },
    ];
  },
};

export default nextConfig;
