import { Suspense } from "react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { TransactionFormSheet, TransactionList } from "@/features/transactions";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Transações</h2>
        <TransactionFormSheet
          trigger={
            <Button>
              <Icon icon={Add01Icon} data-icon="inline-start" />
              Nova transação
            </Button>
          }
        />
      </div>
      <Suspense fallback={null}>
        <TransactionList />
      </Suspense>
    </div>
  );
}
