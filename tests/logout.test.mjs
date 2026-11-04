// Run: npm test. The portal's sign-out, against a stubbed fetch: Frappe v16 accepts logout only
// as a POST, and a POST with the session cookie must carry the CSRF token.
import { test } from "node:test";
import assert from "node:assert/strict";
import { portal } from "../src/lib/api.ts";

test("portal sign-out POSTs to Frappe's logout with the CSRF token", async () => {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method, headers: init.headers ?? {} });
    const body = String(url).includes("auth.session") ? { message: { data: { csrf_token: "token-123" } } } : { message: "ok" };
    return new Response(JSON.stringify(body), { status: 200 });
  };
  await portal.logout();
  const logout = calls.find((c) => String(c.url) === "/api/method/logout");
  assert.ok(logout, "logout was called");
  assert.equal(logout.method, "POST");
  assert.equal(logout.headers["X-Frappe-CSRF-Token"], "token-123");
});
