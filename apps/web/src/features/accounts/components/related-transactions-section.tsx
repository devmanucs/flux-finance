"use client";

import { useSearchParams } from "next/navigation";
import { TransactionList } from "@/features/transactions";
import { isPaymentStatus } from "@/lib/payment-status";

// Contas e transações têm status (vencimento/pago) independentes, mas o
// filtro da sidebar soma os dois. Quando ?status= vem de lá, mostra as
// transações que batem com o filtro aqui embaixo também — senão a contagem
// do badge não bate com o que a página exibe.
export function RelatedTransactionsSection() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  if (!isPaymentStatus(statusParam)) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-heading text-lg font-semibold">Transações</h3>
      <TransactionList />
    </div>
  );
}
