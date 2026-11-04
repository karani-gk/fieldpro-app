// The API contract, as the backend's fieldpro/api/shapes.py defines it. Keep the two in step.

export interface Money {
  amount: string; // a decimal string: "1500.00" (floats lose cents)
  currency: string;
}

export interface Ref {
  id: string;
  name: string;
}

export interface JobSummary {
  id: string;
  issue: string;
  customer: Ref;
  status: string;
  priority: string;
  scheduled_date: string | null; // YYYY-MM-DD
  technician: Ref | null;
  site_address: string;
  updated_at: string; // ISO 8601, UTC
}

export interface Part {
  id: string;
  item: { code: string; name: string };
  qty: number;
  uom: string;
  rate: Money;
  amount: Money;
  client_id: string | null;
}

export interface Photo {
  id: string;
  name: string;
  url: string;
}

export interface Visit {
  id: string;
  job: string;
  technician: string;
  status: "Open" | "Closed";
  started_at: string;
  ended_at: string | null;
  hours: number;
  notes: string;
  client_id: string | null;
  parts: Part[];
  photos: Photo[];
}

export interface Action {
  action: string;
  next_status: string;
}

export interface JobDetail extends JobSummary {
  description: string;
  contact_phone: string;
  source: string;
  estimated_value: Money;
  needs_approval: boolean;
  total_hours: number;
  parts_total: Money;
  signed_off: { by: string; at: string } | null;
  rejection_reason: string | null;
  invoice: string | null;
  payment_status: string;
  visits: Visit[];
  actions: Action[];
}

export interface Page<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface Session {
  user: string;
  full_name: string;
  kind: "manager" | "technician" | "customer" | "none";
  technician: string | null;
  customers: Ref[];
  csrf_token: string | null;
}

export interface StockLine {
  code: string;
  name: string;
  in_van: number;
}

export interface WeekStats {
  from: string;
  to: string;
  jobs_done: number;
  visits: number;
  hours: number;
  days: { date: string; hours: number }[];
}

export interface ServerInfo {
  api_version: string;
  min_client_version: string;
  server_time: string;
  currency: string;
  company: string | null;
}

export type OpKind = "start_visit" | "end_visit" | "add_part";

/** Work done offline, waiting to be pushed (fieldpro.api.v1.sync.push). */
export interface Op {
  client_id: string;
  op: OpKind;
  job: string;
  at: string; // when it happened on the phone, ISO 8601 UTC
  visit?: string; // a visit the server already knows
  visit_client_id?: string; // a visit started offline, known only by its client_id
  item_code?: string;
  item_name?: string;
  qty?: number;
  notes?: string;
}

export interface OpResult {
  client_id: string;
  status: "ok" | "duplicate" | "conflict" | "error";
  visit?: string;
  error?: { code: string; message: string };
  server?: JobDetail | null;
}
