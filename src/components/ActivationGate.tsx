"use client";

// Sign-in forms show only on an activated installation; otherwise this points to /activate.
// The backend refuses sign-in either way: this only saves people a confusing error.

import Link from "next/link";
import { useEffect, useState } from "react";
import { activation } from "@/lib/api";

export default function ActivationGate({ children }: { children: React.ReactNode }) {
  // null while asking. If the question itself fails, show the form: the backend still decides.
  const [activated, setActivated] = useState<boolean | null>(null);

  useEffect(() => {
    activation
      .status()
      .then((s) => setActivated(s.activated))
      .catch(() => setActivated(true));
  }, []);

  if (activated === null) return null;
  if (activated) return <>{children}</>;
  return (
    <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
      <p className="font-semibold">One step first</p>
      <p className="mt-1">This fieldpro installation is not activated yet. Enter the access code from your course email. You only do this once.</p>
      <Link href="/activate" className="btn-primary mt-4 w-full">
        Activate fieldpro
      </Link>
    </div>
  );
}
