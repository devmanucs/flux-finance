import { Suspense } from "react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { AccountFormDialog, AccountList } from "@/features/accounts";

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Contas e cartões</h2>
        <AccountFormDialog
          trigger={
            <Button>
              <Icon icon={Add01Icon} data-icon="inline-start" />
              Nova conta
            </Button>
          }
        />
      </div>
      <Suspense fallback={null}>
        <AccountList />
      </Suspense>
    </div>
  );
}
