# CLAUDE.md - fieldpro-app

Teaching project for UPEO Academy's "ERPNext as a Platform" course: learners read this code. Keep it
plain, commented where the why is not obvious, and consistent with `../fieldpro-bench/apps/fieldpro`.

- Run: `../start-backend.sh`, then `npm run dev` (port 3030). Checks: `npm test`, `npm run typecheck`,
  `npm run lint`, `npm run build` (stop the dev server first: both use `.next`).
- `src/lib/types.ts` mirrors the backend's `fieldpro/api/shapes.py`. Change both together.
- Node's test runner strips types but cannot compile TypeScript-only syntax: no constructor
  parameter properties or enums in files the tests import (`errors.ts`, `offline/queue.ts`).

## Traps found while building (2026-11-04)

- Socket.io's path needs its trailing slash; `skipTrailingSlashRedirect` and the exact `/socket.io/`
  rewrite in `next.config.mjs` keep it.
- Frappe refuses sockets whose Origin and Host differ, and browsers send no Origin on same-origin
  long-polling GETs: `src/middleware.ts` fills it in. The socket.io proxy target must be `localhost`
  (not 127.0.0.1) to match the browser's Origin.
- Browsers cannot put headers on a WebSocket, so the token-authenticated technician app uses
  long-polling.
- Wait for elements, not `networkidle`, in browser tests: long-polling keeps the network busy.
- Sign-in pages are wrapped in `ActivationGate`: until the backend is activated with the course
  access code (once per installation) they point to `/activate`. The backend enforces it anyway.
- If the owner's dev server is running, do not `npm run build` here (it corrupts their `.next`):
  build a copy elsewhere with `node_modules` symlinked.
