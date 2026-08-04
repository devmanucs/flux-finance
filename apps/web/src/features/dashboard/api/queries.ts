import { useFetch } from "@/lib/hooks/use-crud";

export interface DashboardSummary {
  totalBalance: number;
  totalReserved: number;
  totalMealVoucher: number;
  totalDebt: number;
  netWorth: number;
  currentMonth: { income: number; expense: number; net: number };
}

export interface CashflowPoint {
  period: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  categoryId: number | null;
  name: string;
  color: string | null;
  total: number;
}

export function useDashboardSummary() {
  return useFetch<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    route: "/dashboard/summary",
  });
}

export function useCashflow(range: string = "6") {
  return useFetch<CashflowPoint[]>({
    queryKey: ["dashboard-cashflow", range],
    route: "/dashboard/cashflow",
    config: { params: { range } },
  });
}

export function useByCategory(month?: string) {
  return useFetch<CategoryBreakdown[]>({
    queryKey: ["dashboard-by-category", month ?? "current"],
    route: "/dashboard/by-category",
    config: { params: month ? { month } : undefined },
  });
}
