"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@flux-finance/ui/components/ui/chart";
import { useByCategory } from "../api/queries";

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CategoryChart() {
  const { data = [], isPending } = useByCategory();

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
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem despesas neste mês.</p>
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
                  <span className="text-muted-foreground">{currency.format(category.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
