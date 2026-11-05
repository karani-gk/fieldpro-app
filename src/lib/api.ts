// The one file that talks to the backend. Screens call these functions and never use fetch.
//
// Two ways of proving who you are, one per kind of client:
// - The technician app sends its token on every call: `Authorization: token <key>:<secret>`.
//   It sends no cookies at all (credentials: "omit"), so a portal session in the same browser
//   can never mix in, and Frappe does not ask for a CSRF token.
// - The customer portal uses Frappe's session cookie. A cookie is sent automatically, so every
//   POST must also carry the CSRF token from session(): proof the request came from our pages.
//
// Every response is either {"message": {"data": ...}} or an error, which becomes an ApiError.

import { ApiError, offlineError, toApiError } from "./errors.ts";
import type {
  ActivationStatus,
  Action,
  JobDetail,
  JobSummary,
  Op,
  OpResult,
  Page,
  ServerInfo,
  Session,
  StockLine,
  Visit,
  WeekStats,
} from "./types.ts";

const V1 = "/api/method/fieldpro.api.v1";

export type Auth = { token: string } | "session";

let csrfToken: string | null = null;

interface CallOptions {
  auth: Auth | null;
  params?: Record<string, unknown>;
  post?: boolean;
}

async function call<T>(path: string, { auth, params = {}, post = false }: CallOptions, retried = false): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let url = path;
  let body: string | undefined;
  if (post) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(params);
  } else {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    if (query.size) url += `?${query}`;
  }
  if (auth && auth !== "session") headers.Authorization = `token ${auth.token}`;
  if (auth === "session" && post) headers["X-Frappe-CSRF-Token"] = await getCsrfToken();

  let res: Response;
  try {
    res = await fetch(url, {
      method: post ? "POST" : "GET",
      headers,
      body,
      credentials: auth === "session" || auth === null ? "same-origin" : "omit",
    });
  } catch {
    throw offlineError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = toApiError(res.status, data);
    // The session was renewed (a new login, a server restart): fetch a fresh token, retry once.
    if (error.code === "csrf" && !retried) {
      csrfToken = null;
      return call<T>(path, { auth, params, post }, true);
    }
    throw error;
  }
  return data.message as T;
}

async function getCsrfToken(): Promise<string> {
  if (!csrfToken) {
    const session = await portal.session();
    csrfToken = session.csrf_token;
  }
  return csrfToken ?? "";
}

const get = <T>(method: string, auth: Auth | null, params?: Record<string, unknown>) =>
  call<{ data: T }>(`${V1}.${method}`, { auth, params }).then((r) => r.data);
const post = <T>(method: string, auth: Auth | null, params?: Record<string, unknown>) =>
  call<{ data: T }>(`${V1}.${method}`, { auth, params, post: true }).then((r) => r.data);
const page = <T>(method: string, auth: Auth, params?: Record<string, unknown>) =>
  call<Page<T>>(`${V1}.${method}`, { auth, params });

// ---------------------------------------------------------------- the technician app (token)

/** The technician's lists (jobs.list_jobs): finished is Done and Cancelled, latest first. */
export type JobScope = "today" | "open" | "all" | "finished";

export function techApi(token: string) {
  const auth: Auth = { token };
  return {
    session: () => get<Session>("auth.session", auth),
    signOut: () => post<{ signed_out: boolean }>("auth.sign_out_device", auth),
    listJobs: (scope: JobScope = "today", cursor?: string | null) =>
      page<JobSummary>("jobs.list_jobs", auth, { scope, cursor }),
    getJob: (job: string) => get<JobDetail>("jobs.get_job", auth, { job }),
    startVisit: (job: string, clientId: string, startedAt: string) =>
      post<Visit>("visits.start_visit", auth, { job, client_id: clientId, started_at: startedAt }),
    endVisit: (visit: string, endedAt: string, notes?: string) =>
      post<Visit>("visits.end_visit", auth, { visit, ended_at: endedAt, notes }),
    addPart: (visit: string, itemCode: string, qty: number, clientId: string) =>
      post<Visit>("visits.add_part", auth, { visit, item_code: itemCode, qty, client_id: clientId }),
    addPhoto: (visit: string, fileName: string, content: string) =>
      post<{ id: string; url: string }>("visits.add_photo", auth, { visit, file_name: fileName, content }),
    vanStock: (search?: string) => get<StockLine[]>("visits.van_stock", auth, { search }),
    actions: (job: string) => get<Action[]>("workflow.actions", auth, { job }),
    apply: (job: string, action: string, extra: { signature?: string; signed_by?: string; reason?: string } = {}) =>
      post<JobDetail>("workflow.apply", auth, { job, action, ...extra }),
    myWeek: () => get<WeekStats>("reports.my_week", auth),
    syncPull: (cursor?: string | null) =>
      get<{ jobs: JobDetail[]; cursor: string | null; has_more: boolean }>("sync.pull", auth, { cursor }),
    syncPush: (operations: Op[]) => post<OpResult[]>("sync.push", auth, { operations }),
    registerDevice: (pushToken: string) => post<{ registered: boolean }>("devices.register", auth, { token: pushToken, platform: "web" }),
    /** A private file (photo, signature) as a blob URL: <img src> cannot send the token itself. */
    privateFile: async (url: string): Promise<string> => {
      const res = await fetch(url, { headers: { Authorization: `token ${token}` }, credentials: "omit" });
      if (!res.ok) throw toApiError(res.status, {});
      return URL.createObjectURL(await res.blob());
    },
  };
}

export type TechApi = ReturnType<typeof techApi>;

export const auth = {
  /** Email or mobile number and password: the same token as the code. */
  signInWithPassword: (login: string, password: string) =>
    post<{ token: string; user: string; technician: { id: string; name: string } }>("auth.sign_in_with_password", null, { login, password }),
  requestOtp: (mobileNo: string) => post<{ sent: boolean; message: string }>("auth.request_otp", null, { mobile_no: mobileNo }),
  verifyOtp: (mobileNo: string, code: string) =>
    post<{ token: string; user: string; technician: { id: string; name: string } }>("auth.verify_otp", null, {
      mobile_no: mobileNo,
      code,
    }),
};

// ---------------------------------------------------------------- activation (once per installation)

// Open to guests: until the installation is activated with the course access code, nobody can sign in.
export const activation = {
  status: () => get<ActivationStatus>("activation.status", null),
  activate: (code: string) => post<ActivationStatus>("activation.activate", null, { code }),
};

// ---------------------------------------------------------------- the customer portal (cookie)

export const portal = {
  login: async (email: string, password: string) => {
    csrfToken = null;
    await call("/api/method/login", { auth: null, params: { usr: email, pwd: password }, post: true });
    return portal.session();
  },
  logout: async () => {
    // Frappe v16 accepts logout only as a POST, and a POST with the session cookie must carry
    // the CSRF token ("session" adds it). A failure is logged, not hidden: the screen still goes
    // to sign-in, but a session left open on the server should be visible to whoever debugs it.
    try {
      await call("/api/method/logout", { auth: "session", post: true });
    } catch (error) {
      console.error("Portal sign-out: the server did not end the session", error);
    } finally {
      csrfToken = null;
    }
  },
  session: () => get<Session>("auth.session", "session"),
  myJobs: (cursor?: string | null) => page<JobSummary>("portal.my_jobs", "session", { cursor }),
  getJob: (job: string) => get<JobDetail>("jobs.get_job", "session", { job }),
  bookJob: (form: { issue: string; description?: string; site_address?: string; contact_phone?: string; preferred_date?: string }) =>
    post<JobDetail>("portal.book_job", "session", form),
  apply: (job: string, action: string, reason?: string) => post<JobDetail>("workflow.apply", "session", { job, action, reason }),
  /** A link the browser downloads with the session cookie; the server checks the job is yours. */
  jobCardUrl: (job: string) => `${V1}.files.job_card?job=${encodeURIComponent(job)}`,
  /** The job card PDF as a file, or the server's error as an ApiError (not a page of JSON). */
  jobCard: async (job: string): Promise<Blob> => {
    let res: Response;
    try {
      res = await fetch(portal.jobCardUrl(job), { credentials: "same-origin" });
    } catch {
      throw offlineError();
    }
    if (!res.ok) throw toApiError(res.status, await res.json().catch(() => ({})));
    return res.blob();
  },
};

// ---------------------------------------------------------------- server components

/** Fetched by the Next.js server, not the browser: straight to the backend, cached for a minute. */
export async function serverInfo(): Promise<ServerInfo | null> {
  const base = process.env.FRAPPE_URL ?? "http://127.0.0.1:8030";
  try {
    const res = await fetch(`${base}${V1}.meta.info`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()).message.data as ServerInfo;
  } catch {
    return null;
  }
}

export { ApiError };
