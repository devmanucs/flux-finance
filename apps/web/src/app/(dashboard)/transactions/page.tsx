import { TransactionForm, TransactionList } from "@/features/transactions";

export default function TransactionsPage() {
  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <TransactionForm />
      <TransactionList />
    </div>
  );
}
