import { Suspense } from "react";
import { PluggyConnectProvider } from "@/features/pluggy/components/pluggy-connections-panel";
import { AccountList, NewAccountMenu, RelatedTransactionsSection } from "@/features/accounts";

export default function AccountsPage() {
  return (
    <PluggyConnectProvider>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Contas e cartões</h2>
          <NewAccountMenu />
        </div>
        <Suspense fallback={null}>
          <AccountList />
        </Suspense>
        <Suspense fallback={null}>
          <RelatedTransactionsSection />
        </Suspense>
      </div>
    </PluggyConnectProvider>
  );
}
