import { CashflowChart, CategoryChart, SummaryCards } from "@/features/dashboard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold">Dashboard</h2>
      <SummaryCards />
      <div className="grid gap-4 lg:grid-cols-2">
        <CashflowChart />
        <CategoryChart />
      </div>
    </div>
  );
}
