"use client";

import { useState } from "react";
import {
  TransactionForm,
  TransactionList,
  type TransactionWithCategory,
} from "@/features/transactions";

export default function TransactionsPage() {
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold">Transações</h2>
        {editing ? (
          <p className="text-sm text-muted-foreground">
            Editando “{editing.description}”. Salve ou cancele para voltar ao lançamento novo.
          </p>
        ) : null}
      </div>
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <TransactionForm
          transaction={editing ?? undefined}
          onSuccess={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
        <TransactionList onEdit={setEditing} />
      </div>
    </div>
  );
}
