import type { Metadata } from "next";
import PortalProvider from "./PortalProvider";
import PortalShell from "./PortalShell";

export const metadata: Metadata = { title: "Customer portal" };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  );
}
