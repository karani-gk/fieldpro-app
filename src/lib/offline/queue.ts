// The phone's outbox: work done offline, in the order it was done, until the server confirms it.
//
// Kept in localStorage so it survives a closed tab or a dead battery. Pure logic with the storage
// passed in, so it is tested in Node without a browser (tests/queue.test.mjs).

import type { Op, OpResult } from "../types.ts";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SyncOutcome {
  done: string[]; // applied (or already applied): removed from the queue
  conflicts: OpResult[]; // the server won; shown to the technician, removed from the queue
  failed: OpResult[]; // refused for good (bad data); shown, removed so they do not block the rest
}

export class OpQueue {
  private store: KeyValueStore;
  private key: string;

  constructor(store: KeyValueStore, key = "fieldpro.outbox") {
    this.store = store;
    this.key = key;
  }

  all(): Op[] {
    try {
      return JSON.parse(this.store.getItem(this.key) ?? "[]") as Op[];
    } catch {
      return [];
    }
  }

  get size(): number {
    return this.all().length;
  }

  add(op: Op): void {
    this.save([...this.all(), op]);
  }

  forJob(job: string): Op[] {
    return this.all().filter((op) => op.job === job);
  }

  /** Apply the server's answer to a batch. Ops it did not answer stay queued, in order. */
  settle(results: OpResult[]): SyncOutcome {
    const outcome: SyncOutcome = { done: [], conflicts: [], failed: [] };
    const answered = new Set<string>();
    for (const r of results) {
      answered.add(r.client_id);
      if (r.status === "ok" || r.status === "duplicate") outcome.done.push(r.client_id);
      else if (r.status === "conflict") outcome.conflicts.push(r);
      else outcome.failed.push(r);
    }
    this.save(this.all().filter((op) => !answered.has(op.client_id)));
    return outcome;
  }

  /** The visit open on a job right now, as far as this phone knows (server state + outbox). */
  openVisit(job: string, serverOpenVisit: string | null): { visit?: string; visit_client_id?: string } | null {
    let open: { visit?: string; visit_client_id?: string } | null = serverOpenVisit ? { visit: serverOpenVisit } : null;
    for (const op of this.forJob(job)) {
      if (op.op === "start_visit") open = { visit_client_id: op.client_id };
      if (op.op === "end_visit") open = null;
    }
    return open;
  }

  private save(ops: Op[]): void {
    this.store.setItem(this.key, JSON.stringify(ops));
  }
}
