# fieldpro-app

The technician app (`/tech`) and the customer portal (`/portal`) for the
[fieldpro](../fieldpro-bench/apps/fieldpro) Frappe backend. Next.js 14 (App Router), TypeScript,
Tailwind.

```bash
cp .env.example .env.local   # where the backend is
npm ci
npm run dev                  # http://localhost:3030 (the backend must be running)
npm test                     # unit tests (Node's test runner)
npm run typecheck && npm run lint && npm run build
```

## How it talks to the backend

- **One origin.** `next.config.mjs` proxies `/api`, `/private/files` and `/socket.io` to Frappe, so
  the browser never leaves this origin: first-party cookies, no CORS.
- **One file.** `src/lib/api.ts` is the only code that calls the backend. Screens call its functions.
- **Two ways to sign in.** The technician app sends a token on every call and no cookies. The portal
  uses Frappe's session cookie and adds the CSRF token to every POST.
- **One error type.** `src/lib/errors.ts` turns fieldpro's error format and Frappe's own into `ApiError`.
- **Server and browser.** The landing page (`src/app/page.tsx`) is fetched on the server. Signed-in
  screens fetch in the browser, with the user's own token or cookie.

## Offline (technician app)

Work done with no signal (start a visit, add a part, end a visit) goes into an outbox in
`localStorage` (`src/lib/offline/queue.ts`) with a `client_id` made on the phone. `src/lib/offline/sync.ts`
pushes it in batches when the connection returns (and every minute), then pulls what changed since
the server's cursor. A batch sent twice is applied once. If the server says no (the job was
cancelled meanwhile), the server wins and the technician is told. The header always says what is
saved and what is synced.

## Live and push

`src/lib/realtime.ts` subscribes to the backend's `fieldpro_job` events over socket.io (long-polling
through the proxy; `src/middleware.ts` explains the Origin header it adds). `src/lib/push.ts` registers
for Firebase web push when the `NEXT_PUBLIC_FIREBASE_*` settings are filled in; without them the app
runs without push.

## Where things are

| | |
|---|---|
| `src/app/tech/` | technician app: sign-in, today's jobs, a job, my week; `TechProvider.tsx` holds auth, sync and live state |
| `src/app/portal/` | customer portal: sign-in, my jobs (live), book a job, a job (accept or reject, job card) |
| `src/lib/` | `api.ts`, `errors.ts`, `types.ts` (the API contract), `offline/`, `realtime.ts`, `push.ts`, `format.ts` |
| `src/components/` | status badge, error note, signature pad, private image |
| `tests/` | unit tests for the error format and the outbox |

Every pattern here (token storage, outbox and client ids, cursor sync, server-owned workflow
actions) is the same in a Flutter or React Native app.
