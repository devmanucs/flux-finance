"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import { useDashboardSummary } from "../api/queries";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
        ? "text-destructive"
        : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`font-heading text-2xl font-semibold ${toneClass}`}>{currency.format(value)}</p>
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  const { data, isPending } = useDashboardSummary();

  if (isPending || !data) {
    return <p className="text-sm text-muted-foreground">Carregando resumo...</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Saldo total" value={data.totalBalance} />
      <StatCard label="Devendo no cartão" value={data.totalDebt} tone={data.totalDebt > 0 ? "negative" : "default"} />
      <StatCard label="Patrimônio líquido" value={data.netWorth} tone={data.netWorth >= 0 ? "positive" : "negative"} />
      <StatCard
        label="Resultado do mês"
        value={data.currentMonth.net}
        tone={data.currentMonth.net >= 0 ? "positive" : "negative"}
      />
    </div>
  );
}
