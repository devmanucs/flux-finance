"use client";

import { Cell, Pie, PieChart } from "recharts";
import { PieChartIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@flux-finance/ui/components/ui/chart";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import { EmptyState, ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { useByCategory } from "../api/queries";

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryChart() {
  const { data = [], isPending, isError, error, refetch } = useByCategory();

  const chartConfig = data.reduce((config, category, index) => {
    const key = String(category.categoryId ?? "none");
    config[key] = {
      label: category.name,
      color: category.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
    return config;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por categoria (mês atual)</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="mx-auto aspect-square h-56" />
        ) : isError ? (
          isPermissionError(error) ? (
            <UnauthorizedState
              className="h-56"
              description="Você precisa entrar novamente para ver os gastos por categoria."
            />
          ) : (
            <ErrorState
              className="h-56"
              description={`Não foi possível carregar o gráfico${getErrorStatus(error) ? ` (erro ${getErrorStatus(error)})` : ""}.`}
              onRetry={() => refetch()}
            />
          )
        ) : data.length === 0 ? (
          <EmptyState
            className="h-56"
            icon={PieChartIcon}
            title="Sem despesas neste mês"
            description="Categorize suas despesas para ver a distribuição por categoria aqui."
          />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-56">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={45}
                  strokeWidth={2}
                >
                  {data.map((category, index) => (
                    <Cell
                      key={category.categoryId ?? "none"}
                      fill={category.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {data.map((category, index) => (
                <li key={category.categoryId ?? "none"} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          category.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                      }}
                    />
                    {category.name}
                  </span>
                  <span className="text-muted-foreground">{formatMoney(category.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
