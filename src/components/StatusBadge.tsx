const STYLES: Record<string, string> = {
  Booked: "bg-sky-100 text-sky-800",
  Assigned: "bg-indigo-100 text-indigo-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Pending Approval": "bg-rose-100 text-rose-800",
  "Awaiting Sign-off": "bg-orange-100 text-orange-800",
  Done: "bg-emerald-100 text-emerald-800",
  Rework: "bg-rose-100 text-rose-800",
  Cancelled: "bg-slate-200 text-slate-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
