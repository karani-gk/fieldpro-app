import type { ApiError } from "@/lib/errors";

export default function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as ApiError;
  const fields = e.fields ? Object.entries(e.fields) : [];
  return (
    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
      <p>{e.message || "Something went wrong."}</p>
      {fields.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-xs">
          {fields.map(([field, problem]) => (
            <li key={field}>
              {field}: {problem}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
