// Run: npm test  (node --test; Node 22.6+ strips the imported module's TypeScript types)
import { test } from "node:test";
import assert from "node:assert/strict";
import { toApiError } from "../src/lib/errors.ts";

const serverMessages = (...messages) => JSON.stringify(messages.map((m) => JSON.stringify(m)));

test("reads fieldpro's own error format", () => {
  const e = toApiError(422, { error: { code: "invalid", message: "Bad qty", fields: { qty: "must be positive" } } });
  assert.deepEqual([e.status, e.code, e.message, e.fields], [422, "invalid", "Bad qty", { qty: "must be positive" }]);
});

test("reads Frappe's format for requests refused before our code runs", () => {
  const e = toApiError(400, { exc_type: "CSRFTokenError", _server_messages: serverMessages({ message: "Invalid Request" }) });
  assert.equal(e.code, "csrf");
  assert.equal(e.message, "Invalid Request");
});

test("a guest refused by Frappe is told to sign in", () => {
  const e = toApiError(403, {
    exc_type: "PermissionError",
    _server_messages: serverMessages({ message: "You are not permitted to access this resource. Login to access" }),
  });
  assert.equal(e.code, "unauthorized");
});

test("strips HTML from Frappe's messages", () => {
  const e = toApiError(417, { exc_type: "ValidationError", _server_messages: serverMessages({ message: "Row <b>1</b>: bad" }) });
  assert.equal(e.message, "Row 1 : bad");
});

test("an empty body still gives a usable error", () => {
  const e = toApiError(502, {});
  assert.equal(e.code, "http_502");
  assert.match(e.message, /server/);
});
