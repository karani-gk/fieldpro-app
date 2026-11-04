import type { Metadata } from "next";
import TechProvider from "./TechProvider";
import TechShell from "./TechShell";

export const metadata: Metadata = { title: "Technician" };

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <TechProvider>
      <TechShell>{children}</TechShell>
    </TechProvider>
  );
}
