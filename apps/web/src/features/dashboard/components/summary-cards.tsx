"use client";

import {
  ChartUpIcon,
  CreditCardIcon,
  MoneyBag02Icon,
  PiggyBankIcon,
  Restaurant01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import { ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { useDashboardSummary } from "../api/queries";

const TONE_CLASSES = {
  default: { text: "", badge: "bg-muted text-muted-foreground" },
  positive: {
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  negative: {
    text: "text-destructive",
    badge: "bg-destructive/10 text-destructive",
  },
} as const;

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Wallet01Icon;
  tone?: keyof typeof TONE_CLASSES;
}) {
  const toneClass = TONE_CLASSES[tone];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClass.badge}`}>
          <Icon icon={icon} size={18} />
        </span>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`font-heading text-2xl font-semibold ${toneClass.text}`}>{formatMoney(value)}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Skeleton className="size-9 shrink-0 rounded-full" />
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Saldo total" value={data.totalBalance} icon={Wallet01Icon} />
      <StatCard label="Guardado" value={data.totalReserved} icon={PiggyBankIcon} />
      <StatCard label="Vale-alimentação" value={data.totalMealVoucher} icon={Restaurant01Icon} />
      <StatCard
        label="Devendo no cartão"
        value={data.totalDebt}
        icon={CreditCardIcon}
        tone={data.totalDebt > 0 ? "negative" : "default"}
      />
      <StatCard
        label="Patrimônio líquido"
        value={data.netWorth}
        icon={ChartUpIcon}
        tone={data.netWorth >= 0 ? "positive" : "negative"}
      />
      <StatCard
        label="Resultado do mês"
        value={data.currentMonth.net}
        icon={MoneyBag02Icon}
        tone={data.currentMonth.net >= 0 ? "positive" : "negative"}
      />
    </div>
  );
}
