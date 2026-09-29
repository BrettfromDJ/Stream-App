export const dynamic = "force-dynamic";

import { AppShell } from "@/components/nav/app-nav";
import { QuickActionsProvider } from "@/components/library/quick-actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickActionsProvider>
      <AppShell>
        <main className="min-h-dvh pb-nav">{children}</main>
      </AppShell>
    </QuickActionsProvider>
  );
}
