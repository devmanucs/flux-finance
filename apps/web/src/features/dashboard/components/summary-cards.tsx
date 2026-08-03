"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import { ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { useDashboardSummary } from "../api/queries";

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
        <p className={`font-heading text-2xl font-semibold ${toneClass}`}>{formatMoney(value)}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  const { data, isPending, isError, error, refetch } = useDashboardSummary();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return isPermissionError(error) ? (
      <UnauthorizedState description="Você precisa entrar novamente para ver o resumo financeiro." />
    ) : (
      <ErrorState
        description={`Não foi possível carregar o resumo${getErrorStatus(error) ? ` (erro ${getErrorStatus(error)})` : ""}.`}
        onRetry={() => refetch()}
      />
    );
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
