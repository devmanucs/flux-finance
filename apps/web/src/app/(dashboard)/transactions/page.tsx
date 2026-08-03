import { TransactionForm, TransactionList } from "@/features/transactions";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold">Transações</h2>
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <TransactionForm />
        <TransactionList />
      </div>
    </div>
  );
}
