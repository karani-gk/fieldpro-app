import { test } from "node:test";
import assert from "node:assert/strict";
import { OpQueue } from "../src/lib/offline/queue.ts";

function memory() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
}

const start = { client_id: "v1", op: "start_visit", job: "JOB-1", at: "2026-11-04T06:00:00Z" };
const part = { client_id: "p1", op: "add_part", job: "JOB-1", at: "2026-11-04T06:10:00Z", visit_client_id: "v1", item_code: "CAP", qty: 1 };
const end = { client_id: "e1", op: "end_visit", job: "JOB-1", at: "2026-11-04T07:00:00Z", visit_client_id: "v1" };

test("keeps work in the order it was done, across reloads", () => {
  const store = memory();
  const q = new OpQueue(store);
  q.add(start);
  q.add(part);
  assert.deepEqual(new OpQueue(store).all().map((o) => o.client_id), ["v1", "p1"]);
});

test("ok and duplicate both mean done; unanswered ops stay queued", () => {
  const q = new OpQueue(memory());
  [start, part, end].forEach((o) => q.add(o));
  const outcome = q.settle([
    { client_id: "v1", status: "ok" },
    { client_id: "p1", status: "duplicate" },
  ]);
  assert.deepEqual(outcome.done, ["v1", "p1"]);
  assert.deepEqual(q.all().map((o) => o.client_id), ["e1"]);
});

test("conflicts and failures leave the queue so they never block it", () => {
  const q = new OpQueue(memory());
  [start, part].forEach((o) => q.add(o));
  const outcome = q.settle([
    { client_id: "v1", status: "conflict", error: { code: "conflict", message: "Cancelled" } },
    { client_id: "p1", status: "error", error: { code: "invalid", message: "No such item" } },
  ]);
  assert.equal(outcome.conflicts.length, 1);
  assert.equal(outcome.failed.length, 1);
  assert.equal(q.size, 0);
});

test("knows which visit is open from the server's state and the outbox", () => {
  const q = new OpQueue(memory());
  assert.deepEqual(q.openVisit("JOB-1", "VIS-9"), { visit: "VIS-9" });
  q.add(start);
  assert.deepEqual(q.openVisit("JOB-1", null), { visit_client_id: "v1" });
  q.add(end);
  assert.equal(q.openVisit("JOB-1", null), null);
});
