export const dynamic = "force-dynamic";

import { BottomNav, Sidebar } from "@/components/nav/app-nav";
import { QuickActionsProvider } from "@/components/library/quick-actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickActionsProvider>
      <Sidebar />
      <div className="min-h-dvh lg:pl-[220px]">
        <main className="pb-nav">{children}</main>
      </div>
      <BottomNav />
    </QuickActionsProvider>
  );
}
