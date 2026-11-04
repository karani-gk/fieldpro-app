// Background sync: push the outbox, then pull what changed (the backend's services/sync.py).
//
// Push first, so the pull brings back the server's view of our own work too. A network failure
// stops the run and leaves everything queued; the next run (back online, or the timer) retries.
// Because every op has a client_id, a batch that was applied but whose answer was lost is sent
// again safely: the server answers "duplicate".

import type { TechApi } from "../api.ts";
import type { ApiError } from "../errors.ts";
import type { JobDetail, OpResult } from "../types.ts";
import type { KeyValueStore, OpQueue } from "./queue.ts";

const BATCH = 20;
const CURSOR_KEY = "fieldpro.sync_cursor";
const JOBS_KEY = "fieldpro.jobs";

export interface SyncReport {
  pushed: number;
  pulled: number;
  conflicts: OpResult[];
  failed: OpResult[];
  offline: boolean;
}

export async function syncNow(api: TechApi, queue: OpQueue, store: KeyValueStore): Promise<SyncReport> {
  const report: SyncReport = { pushed: 0, pulled: 0, conflicts: [], failed: [], offline: false };
  try {
    while (queue.size) {
      const batch = queue.all().slice(0, BATCH);
      const outcome = queue.settle(await api.syncPush(batch));
      report.pushed += outcome.done.length;
      report.conflicts.push(...outcome.conflicts);
      report.failed.push(...outcome.failed);
    }
    let cursor = store.getItem(CURSOR_KEY);
    for (;;) {
      const page = await api.syncPull(cursor);
      saveJobs(store, page.jobs);
      report.pulled += page.jobs.length;
      cursor = page.cursor;
      if (cursor) store.setItem(CURSOR_KEY, cursor);
      if (!page.has_more) break;
    }
  } catch (error) {
    if ((error as ApiError).isOffline) report.offline = true;
    else throw error;
  }
  return report;
}

/** Jobs as last seen from the server: what the app shows when there is no signal. */
export function cachedJobs(store: KeyValueStore): Record<string, JobDetail> {
  try {
    return JSON.parse(store.getItem(JOBS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveJobs(store: KeyValueStore, jobs: JobDetail[]): void {
  const all = cachedJobs(store);
  for (const job of jobs) all[job.id] = job;
  store.setItem(JOBS_KEY, JSON.stringify(all));
}

export function forgetEverything(store: { removeItem(key: string): void }): void {
  for (const key of [CURSOR_KEY, JOBS_KEY, "fieldpro.outbox"]) store.removeItem(key);
}
