// Display helpers. The API sends UTC (ISO 8601) and decimal strings; people read local time and
// formatted money.

export function money(m: { amount: string; currency: string } | null | undefined): string {
  if (!m) return "";
  const value = Number(m.amount);
  return `${m.currency} ${value.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

export function day(isoDate: string | null | undefined): string {
  if (!isoDate) return "Not scheduled";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function newClientId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${random}`;
}
