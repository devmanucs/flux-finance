import { useFetch } from "@/lib/hooks/use-crud";

export interface DashboardSummary {
  totalBalance: number;
  totalDebt: number;
  netWorth: number;
  currentMonth: { income: number; expense: number; net: number };
}

export interface CashflowPoint {
  month: string;
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

export function useCashflow(months = 6) {
  return useFetch<CashflowPoint[]>({
    queryKey: ["dashboard-cashflow", months],
    route: "/dashboard/cashflow",
    config: { params: { months } },
  });
}

export function useByCategory(month?: string) {
  return useFetch<CategoryBreakdown[]>({
    queryKey: ["dashboard-by-category", month ?? "current"],
    route: "/dashboard/by-category",
    config: { params: month ? { month } : undefined },
  });
}
