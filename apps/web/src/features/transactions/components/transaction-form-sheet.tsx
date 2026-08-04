"use client";

import { useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@flux-finance/ui/components/ui/sheet";
import type { TransactionWithCategory } from "../api/queries";
import { TransactionForm } from "./transaction-form";

export function TransactionFormSheet({
  trigger,
  transaction,
}: {
  trigger: ReactNode;
  transaction?: TransactionWithCategory;
}) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(transaction);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger as React.ReactElement} />
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar transação" : "Nova transação"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Atualize os dados do lançamento." : "Lance uma nova receita ou despesa."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-6 pb-6">
          <TransactionForm
            transaction={transaction}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
