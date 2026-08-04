"use client";

import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { Badge } from "@flux-finance/ui/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@flux-finance/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@flux-finance/ui/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flux-finance/ui/components/ui/select";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  UnauthorizedState,
} from "@flux-finance/ui/components/ui/status-state";
import { ChartLineData02Icon } from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis } from "recharts";
import { useCashflow } from "../api/queries";

const chartConfig = {
  income: { label: "Entradas", color: "var(--chart-2)" },
  expense: { label: "Saídas", color: "var(--chart-1)" },
} satisfies ChartConfig;

const RANGE_OPTIONS = [
  { value: "1w", label: "1 semana" },
  { value: "1", label: "1 mês" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
];

function formatPeriod(period: string) {
  const parts = period.split("-").map(Number);

  if (parts.length === 3) {
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  const [year, month] = parts;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short" });
}

export function CashflowChart() {
  const [range, setRange] = useState("6");
  const {
    data = [],
    isPending,
    isError,
    error,
    refetch,
  } = useCashflow(range);

  const { total, trendPct } = useMemo(() => {
    const totalNet = data.reduce(
      (sum, point) => sum + (point.income - point.expense),
      0,
    );

    if (data.length < 2) {
      return { total: totalNet, trendPct: null as number | null };
    }

    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const lastNet = last.income - last.expense;
    const prevNet = prev.income - prev.expense;

    const pct =
      prevNet !== 0 ? ((lastNet - prevNet) / Math.abs(prevNet)) * 100 : null;
    return { total: totalNet, trendPct: pct };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Fluxo de caixa (entradas x saídas)
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-semibold">
              {formatMoney(total)}
            </span>
            {trendPct !== null && (
              <Badge variant={trendPct >= 0 ? "default" : "destructive"}>
                {trendPct >= 0 ? "+" : ""}
                {trendPct.toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
        <CardAction>
          <Select
            items={RANGE_OPTIONS}
            value={range}
            onValueChange={(value) => value && setRange(value)}
          >
            <SelectTrigger className="w-[120px] p-5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          isPermissionError(error) ? (
            <UnauthorizedState
              className="h-64"
              description="Você precisa entrar novamente para ver o fluxo de caixa."
            />
          ) : (
            <ErrorState
              className="h-64"
              description={`Não foi possível carregar o gráfico${getErrorStatus(error) ? ` (erro ${getErrorStatus(error)})` : ""}.`}
              onRetry={() => refetch()}
            />
          )
        ) : data.length === 0 ? (
          <EmptyState
            className="h-64"
            icon={ChartLineData02Icon}
            title="Sem transações no período"
            description="Lance receitas e despesas para ver a evolução do seu caixa aqui."
          />
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={formatPeriod}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                fill="url(#fillIncome)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="var(--color-expense)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
