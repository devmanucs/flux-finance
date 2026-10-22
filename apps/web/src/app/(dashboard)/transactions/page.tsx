import { Suspense } from "react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { TransactionFormSheet, TransactionList } from "@/features/transactions";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionList
        actions={
          <TransactionFormSheet
            trigger={
              <Button>
                <Icon icon={Add01Icon} data-icon="inline-start" />
                Nova transação
              </Button>
            }
          />
        }
      />
    </Suspense>
  );
}
