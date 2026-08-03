"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BankIcon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import type { Account } from "@flux-finance/database";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flux-finance/ui/components/ui/tooltip";
import { EmptyState, ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { useAccounts } from "../api/queries";
import {
  getAccountPaymentStatus,
  isAccountPaymentStatus,
  PAYMENT_STATUS_META,
} from "../lib/payment-status";
import { accountTypeOptions, DEBT_ACCOUNT_TYPES } from "../schemas/account-schema";
import { AccountFormDialog } from "./account-form-dialog";
import { DeleteAccountButton } from "./delete-account-button";

function typeLabel(type: string) {
  return accountTypeOptions.find((option) => option.value === type)?.label ?? type;
}

function formatDueDate(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR");
}

function AccountCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-2.5 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-3 w-20" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-28" />
      </CardContent>
      <CardFooter className="justify-end gap-1">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </CardFooter>
    </Card>
  );
}

function PaymentStatusDot({ account }: { account: Account }) {
  const status = getAccountPaymentStatus(account);
  if (!status) return null;
  const meta = PAYMENT_STATUS_META[status];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded-full"
            aria-label={meta.shortLabel}
          />
        }
      >
        <span className={`size-2.5 rounded-full ${meta.dotClassName}`} />
      </TooltipTrigger>
      <TooltipContent>{meta.shortLabel}</TooltipContent>
    </Tooltip>
  );
}

export function AccountList() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter = isAccountPaymentStatus(statusParam) ? statusParam : null;

  const { data: accounts = [], isPending, isError, error, refetch } = useAccounts();

  const filteredAccounts = statusFilter
    ? accounts.filter((account) => getAccountPaymentStatus(account) === statusFilter)
    : accounts;

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AccountCardSkeleton />
        <AccountCardSkeleton />
        <AccountCardSkeleton />
      </div>
    );
  }

  if (isError) {
    return isPermissionError(error) ? (
      <UnauthorizedState description="Você precisa entrar novamente para ver suas contas." />
    ) : (
      <ErrorState
        description={`Não foi possível carregar suas contas${getErrorStatus(error) ? ` (erro ${getErrorStatus(error)})` : ""}.`}
        onRetry={() => refetch()}
      />
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={BankIcon}
        title="Nenhuma conta cadastrada"
        description="Cadastre suas contas e cartões para acompanhar saldo e dívidas em um só lugar."
        action={
          <AccountFormDialog trigger={<Button size="sm">Cadastrar primeira conta</Button>} />
        }
      />
    );
  }

  if (filteredAccounts.length === 0 && statusFilter) {
    const meta = PAYMENT_STATUS_META[statusFilter];
    return (
      <EmptyState
        icon={BankIcon}
        title={`Nenhuma conta ${meta.shortLabel.toLowerCase()}`}
        description="Nada por aqui com esse status. Ajuste o vencimento ou marque como paga na edição da conta."
        action={
          <Button size="sm" variant="outline" render={<Link href="/accounts" />}>
            Ver todas
          </Button>
        }
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {statusFilter ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={`inline-block size-2 rounded-full ${PAYMENT_STATUS_META[statusFilter].dotClassName}`}
              />
              Filtrando: {PAYMENT_STATUS_META[statusFilter].label}
            </p>
            <Button size="sm" variant="ghost" render={<Link href="/accounts" />}>
              Limpar filtro
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => {
            const isDebt = DEBT_ACCOUNT_TYPES.includes(
              account.type as (typeof DEBT_ACCOUNT_TYPES)[number],
            );
            const amount = Number(account.balance);
            const dueLabel = formatDueDate(account.dueDate);

            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <PaymentStatusDot account={account} />
                  </div>
                  <p className="text-xs text-muted-foreground">{typeLabel(account.type)}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {isDebt ? "Você deve" : "Saldo atual"}
                  </p>
                  <p
                    className={
                      isDebt
                        ? "font-heading text-xl font-semibold text-destructive"
                        : "font-heading text-xl font-semibold"
                    }
                  >
                    {formatMoney(amount)}
                  </p>
                  {dueLabel ? (
                    <p className="mt-1 text-xs text-muted-foreground">Vence em {dueLabel}</p>
                  ) : null}
                </CardContent>
                <CardFooter className="justify-end gap-1">
                  <AccountFormDialog
                    account={account}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${account.name}`}>
                        <Icon icon={PencilEdit02Icon} />
                      </Button>
                    }
                  />
                  <DeleteAccountButton account={account} />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
