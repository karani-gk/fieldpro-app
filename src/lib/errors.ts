// One error type for the whole app, whatever the backend sent.
//
// fieldpro endpoints answer {"error": {"code", "message", "fields"}}. Requests refused by Frappe
// before our code runs (no session, a bad CSRF token, an unknown method) come in Frappe's own
// format: {"exc_type": "CSRFTokenError", "_server_messages": "[\"{\\\"message\\\": ...}\"]"}.
// toApiError reads both, so screens only ever deal with ApiError.

// Plain fields, not constructor parameter properties: Node's test runner strips types but does
// not compile TypeScript-only syntax.
export class ApiError extends Error {
  status: number;
  code: string;
  fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  get isOffline(): boolean {
    return this.code === "offline";
  }
}

const FRAPPE_CODES: Record<string, string> = {
  CSRFTokenError: "csrf",
  AuthenticationError: "unauthorized",
  SessionExpired: "unauthorized",
  PermissionError: "forbidden",
  DoesNotExistError: "not_found",
  ValidationError: "invalid",
  TooManyRequestsError: "rate_limited",
};

export function toApiError(status: number, body: unknown): ApiError {
  const b = (body ?? {}) as Record<string, unknown>;
  const ours = b.error as { code?: string; message?: string; fields?: Record<string, string> } | undefined;
  if (ours && typeof ours === "object" && ours.code) {
    return new ApiError(status, ours.code, ours.message ?? ours.code, ours.fields ?? {});
  }
  const excType = typeof b.exc_type === "string" ? b.exc_type : "";
  let code = FRAPPE_CODES[excType] ?? `http_${status}`;
  // A guest refused by Frappe means "sign in", not "you may not".
  if (code === "forbidden" && status === 403 && /login/i.test(frappeMessage(b))) code = "unauthorized";
  return new ApiError(status, code, frappeMessage(b) || defaultMessage(status));
}

/** The human message out of Frappe's doubly JSON-encoded _server_messages, without HTML. */
export function frappeMessage(body: Record<string, unknown>): string {
  const raw = body._server_messages;
  if (typeof raw === "string") {
    try {
      const first = JSON.parse(raw)[0];
      const message = typeof first === "string" ? JSON.parse(first).message : first?.message;
      if (message) return stripHtml(String(message));
    } catch {
      // not the shape we expected; fall through to the exception text
    }
  }
  if (typeof body.exception === "string") return stripHtml(body.exception.replace(/^[\w.]+:\s*/, ""));
  return "";
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function defaultMessage(status: number): string {
  if (status >= 500) return "The server had a problem. Try again in a moment.";
  return "The request was not accepted.";
}

export function offlineError(): ApiError {
  return new ApiError(0, "offline", "No connection. Your work is saved on this phone and will sync.");
}
