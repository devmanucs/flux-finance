"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis } from "recharts";
import { Badge } from "@flux-finance/ui/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
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
import { useCashflow } from "../api/queries";

const chartConfig = {
  income: { label: "Entradas", color: "var(--chart-2)" },
  expense: { label: "Saídas", color: "var(--chart-1)" },
} satisfies ChartConfig;

const RANGE_OPTIONS = [
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "24", label: "2 anos" },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short" });
}

export function CashflowChart() {
  const [months, setMonths] = useState("6");
  const { data = [], isPending } = useCashflow(Number(months));

  const { total, trendPct } = useMemo(() => {
    const totalNet = data.reduce((sum, point) => sum + (point.income - point.expense), 0);

    if (data.length < 2) {
      return { total: totalNet, trendPct: null as number | null };
    }

    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const lastNet = last.income - last.expense;
    const prevNet = prev.income - prev.expense;

    const pct = prevNet !== 0 ? ((lastNet - prevNet) / Math.abs(prevNet)) * 100 : null;
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
            <span className="font-heading text-2xl font-semibold">{currency.format(total)}</span>
            {trendPct !== null && (
              <Badge variant={trendPct >= 0 ? "default" : "destructive"}>
                {trendPct >= 0 ? "+" : ""}
                {trendPct.toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
        <CardAction>
          <Select value={months} onValueChange={(value) => value && setMonths(value)}>
            <SelectTrigger className="w-[120px]">
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
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem transações no período.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
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
