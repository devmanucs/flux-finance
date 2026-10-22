"use client";

import type React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Add01Icon,
  BankIcon,
  Cancel01Icon,
  Coins01Icon,
  CreditCardIcon,
  Link04Icon,
  Money03Icon,
  PencilEdit02Icon,
  PiggyBankIcon,
  RefreshIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card } from "@flux-finance/ui/components/ui/card";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flux-finance/ui/components/ui/tooltip";
import { ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { cn } from "@flux-finance/ui/lib/utils";
import {
  type PluggyConnection,
  usePluggyConnect,
  usePluggyConnections,
  useSyncBanks,
} from "@/features/pluggy/components/pluggy-connections-panel";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import {
  getPaymentStatus,
  isPaymentStatus,
  PAYMENT_STATUS_META,
  type PaymentStatus,
} from "@/lib/payment-status";
import { type Account, type CreditCardSummary, getCreditCardSummary, useAccounts } from "../api/queries";
import { getBankBrand } from "../lib/bank-brand";
import { accountTypeOptions, DEBT_ACCOUNT_TYPES } from "../schemas/account-schema";
import { AccountFormDialog } from "./account-form-dialog";
import { DeleteAccountButton } from "./delete-account-button";

type IconSvg = React.ComponentProps<typeof Icon>["icon"];

const TYPE_ICONS: Record<string, IconSvg> = {
  CHECKING: Wallet01Icon,
  SAVINGS: PiggyBankIcon,
  CREDIT_CARD: CreditCardIcon,
  INVESTMENT: Coins01Icon,
  CASH: Money03Icon,
  MEAL_VOUCHER: Money03Icon,
};

function typeLabel(type: string) {
  return accountTypeOptions.find((option) => option.value === type)?.label ?? type;
}

function isDebtAccount(account: Account) {
  return DEBT_ACCOUNT_TYPES.includes(account.type as (typeof DEBT_ACCOUNT_TYPES)[number]);
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(" ", ", ");
}

function formatDueDate(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Saldo total = dinheiro em conta. Guardado (investimentos/reservas) e o que
// se deve nos cartões aparecem separados embaixo, sem misturar no número.
function summarize(accounts: Account[]) {
  return accounts.reduce(
    (totals, account) => {
      const amount = Number(account.balance);
      if (isDebtAccount(account)) totals.cards += amount;
      else if (account.isReserved) totals.reserved += amount;
      else totals.balance += amount;
      return totals;
    },
    { balance: 0, reserved: 0, cards: 0 },
  );
}

// Ordem dentro de um banco: contas, guardado e, por último, cartões.
const TILE_ORDER = ["CHECKING", "SAVINGS", "CASH", "MEAL_VOUCHER", "INVESTMENT", "CREDIT_CARD"];

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

type BillStatus = "paid" | "closed" | "overdue";

function lastBillStatus(bill: NonNullable<CreditCardSummary["lastBill"]>): BillStatus {
  if (bill.total <= 0 || bill.paid >= bill.total - 0.01) return "paid";
  return new Date(bill.dueDate) < startOfToday() ? "overdue" : "closed";
}

type BankGroup = {
  key: string;
  name: string;
  connection: PluggyConnection | null;
  accounts: Account[];
};

function groupAccounts(accounts: Account[], connections: PluggyConnection[]) {
  const connectionsById = new Map(connections.map((connection) => [connection.id, connection]));
  const banks = new Map<string, BankGroup>();
  const manual: Account[] = [];

  for (const account of accounts) {
    const connection = account.pluggyConnectionId ? connectionsById.get(account.pluggyConnectionId) : undefined;
    if (!connection) {
      manual.push(account);
      continue;
    }
    // Agrupa pelo nome do banco: dois itens do mesmo banco viram um grupo só.
    const key = connection.institutionName.toLowerCase();
    const group = banks.get(key) ?? { key, name: connection.institutionName, connection, accounts: [] };
    group.accounts.push(account);
    banks.set(key, group);
  }

  for (const group of banks.values()) {
    group.accounts.sort((a, b) => TILE_ORDER.indexOf(a.type) - TILE_ORDER.indexOf(b.type));
  }

  return { banks: [...banks.values()], manual };
}

function SummaryCard({
  accounts,
  bankCount,
  connections,
}: {
  accounts: Account[];
  bankCount: number;
  connections: PluggyConnection[];
}) {
  const { mutate: syncBanks, isPending: isSyncing } = useSyncBanks();
  const totals = summarize(accounts);
  const lastSync = connections
    .map((connection) => connection.lastSyncedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const hasProblem = connections.some((connection) => {
    const status = connection.status.toUpperCase();
    return status === "ERROR" || status === "PARTIAL" || status.includes("LOGIN") || status.includes("WAITING");
  });

  return (
    <Card className="flex-row flex-wrap items-end justify-between gap-4 px-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Saldo total</span>
        <span
          className={cn(
            "font-heading text-4xl font-semibold tracking-tight tabular-nums",
            totals.balance < 0 && "text-destructive",
          )}
        >
          {formatMoney(totals.balance)}
        </span>
        <span className="text-xs text-muted-foreground">
          {plural(accounts.length, "conta", "contas")}
          {bankCount > 0 ? ` · ${plural(bankCount, "banco", "bancos")}` : ""}
        </span>
        {totals.reserved > 0 || totals.cards > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {totals.reserved > 0 ? (
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Guardado</span>
                <span className="text-sm font-semibold tabular-nums">{formatMoney(totals.reserved)}</span>
              </div>
            ) : null}
            {totals.cards > 0 ? (
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Devendo nos cartões</span>
                <span className="text-sm font-semibold text-destructive tabular-nums">{formatMoney(totals.cards)}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {connections.length > 0 ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-muted/60 px-3 text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", hasProblem ? "bg-amber-500" : "bg-emerald-500")} />
            {isSyncing
              ? "Atualizando..."
              : hasProblem
                ? "Algum banco não atualizou"
                : lastSync
                  ? `Atualizada em ${formatDateTime(lastSync)}`
                  : "Aguardando sincronização"}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Buscar dados novos dos bancos"
                  disabled={isSyncing}
                  onClick={() => syncBanks()}
                />
              }
            >
              <Icon icon={RefreshIcon} className={cn(isSyncing && "animate-spin")} />
            </TooltipTrigger>
            <TooltipContent>Buscar dados novos dos bancos</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
    </Card>
  );
}

function PaymentStatusDot({ account }: { account: Account }) {
  const status = getPaymentStatus(account);
  if (!status) return null;
  const meta = PAYMENT_STATUS_META[status];
  const dueLabel = formatDueDate(account.dueDate);

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
        <span className={`size-2 rounded-full ${meta.dotClassName}`} />
      </TooltipTrigger>
      <TooltipContent>
        {meta.shortLabel}
        {dueLabel && status !== "paid" ? ` · vence ${dueLabel}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

const BILL_STATUS_META: Record<BillStatus, { label: (dueDate: string) => string; className: string }> = {
  paid: { label: () => "Paga", className: PAYMENT_STATUS_META.paid.badgeClassName },
  closed: {
    label: (dueDate) => `Vence ${formatDueDate(dueDate)}`,
    className: PAYMENT_STATUS_META.due_soon.badgeClassName,
  },
  overdue: {
    label: (dueDate) => `Venceu ${formatDueDate(dueDate)}`,
    className: PAYMENT_STATUS_META.overdue.badgeClassName,
  },
};

// Cartão sincronizado: fatura aberta em destaque, a última fechada com o
// status (paga / a vencer / vencida) e o total comprometido no limite.
function CreditCardTile({ account, summary }: { account: Account; summary: CreditCardSummary }) {
  const { openBill, lastBill, limit, available, used, futureInstallments } = summary;
  const status = lastBill ? lastBillStatus(lastBill) : null;
  const usedRatio = limit && used !== null ? Math.min(1, Math.max(0, used / limit)) : null;
  const openDates = [
    openBill.closeDate ? `fecha ${formatDueDate(openBill.closeDate)}` : null,
    openBill.dueDate ? `vence ${formatDueDate(openBill.dueDate)}` : null,
  ].filter(Boolean);

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-3xl bg-muted/50 p-4 sm:col-span-2 dark:bg-muted/30">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/70 text-muted-foreground dark:bg-background/40">
          <Icon icon={CreditCardIcon} className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">Cartão de crédito</span>
          <span className="truncate text-xs text-muted-foreground">{account.name}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Fatura aberta</span>
          <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(openBill.amount)}
          </span>
        </div>
        {openDates.length > 0 ? (
          <span className="pb-1 text-xs text-muted-foreground">{openDates.join(" · ")}</span>
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
        {lastBill && status ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Última fatura fechada</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{formatMoney(lastBill.total)}</span>
              <span
                className={cn(
                  "inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium",
                  BILL_STATUS_META[status].className,
                )}
              >
                {BILL_STATUS_META[status].label(lastBill.dueDate)}
              </span>
            </div>
            {status !== "paid" && lastBill.paid > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                Pago {formatMoney(lastBill.paid)} · falta {formatMoney(lastBill.total - lastBill.paid)}
              </span>
            ) : null}
          </div>
        ) : null}

        {used !== null ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Total no cartão</span>
            <span className={cn("text-sm font-semibold tabular-nums", used > 0 && "text-destructive")}>
              {formatMoney(used)}
            </span>
            {futureInstallments > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                Inclui {formatMoney(futureInstallments)} em parcelas futuras
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {usedRatio !== null && limit ? (
        <div className="flex flex-col gap-1.5">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-background/80 dark:bg-background/40"
            role="progressbar"
            aria-label="Limite usado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(usedRatio * 100)}
          >
            <div
              className={cn(
                "h-full rounded-full",
                usedRatio > 0.8 ? "bg-destructive" : usedRatio > 0.5 ? "bg-amber-500" : "bg-emerald-500",
              )}
              style={{ width: `${usedRatio * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatMoney(available ?? 0)} disponível de {formatMoney(limit)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function AccountTile({ account, editable }: { account: Account; editable: boolean }) {
  const isDebt = isDebtAccount(account);
  const amount = Number(account.balance);
  const title = editable ? account.name : typeLabel(account.type);
  // Cartões ("GOLD") e investimentos ("3 aplicações em CDB") sincronizados
  // têm nome próprio que vale mostrar.
  const subtitle = editable
    ? typeLabel(account.type)
    : isDebt || account.type === "INVESTMENT"
      ? account.name
      : null;
  const creditCard = isDebt ? getCreditCardSummary(account) : null;
  if (creditCard) return <CreditCardTile account={account} summary={creditCard} />;

  return (
    <div className="group/tile flex min-w-0 flex-col gap-5 rounded-3xl bg-muted/50 p-4 dark:bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/70 text-muted-foreground dark:bg-background/40">
            <Icon icon={TYPE_ICONS[account.type] ?? Wallet01Icon} className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{title}</span>
            {subtitle ? <span className="truncate text-xs text-muted-foreground">{subtitle}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <PaymentStatusDot account={account} />
          {editable ? (
            <div className="flex opacity-0 transition-opacity group-hover/tile:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
              <AccountFormDialog
                account={account}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={`Editar ${account.name}`}>
                    <Icon icon={PencilEdit02Icon} />
                  </Button>
                }
              />
              <DeleteAccountButton account={account} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">
          {isDebt ? "Fatura atual" : account.isReserved ? "Guardado" : "Saldo atual"}
        </span>
        <span
          className={cn(
            "font-heading text-2xl font-semibold tracking-tight tabular-nums",
            (amount < 0 || (isDebt && amount > 0)) && "text-destructive",
          )}
        >
          {formatMoney(amount)}
        </span>
        {account.isReserved ? <span className="text-xs text-muted-foreground">Fora do saldo total</span> : null}
      </div>
    </div>
  );
}

function BankGroupCard({ group }: { group: BankGroup }) {
  const brand = getBankBrand(group.name);

  return (
    <Card className="gap-4 px-3 pt-4 pb-3">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted font-heading text-base font-semibold"
            style={brand.color ? { backgroundColor: brand.color, color: brand.foreground } : undefined}
            aria-hidden
          >
            {brand.initial}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-heading text-base font-semibold">{group.name}</span>
            <span className="text-xs text-muted-foreground">
              Open Finance · {plural(group.accounts.length, "conta", "contas")}
            </span>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
          <Icon icon={Link04Icon} className="size-3.5" />
          Saldos atualizados pelo banco
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {group.accounts.map((account) => (
          <AccountTile key={account.id} account={account} editable={false} />
        ))}
      </div>
    </Card>
  );
}

function ManualGroupCard({ accounts }: { accounts: Account[] }) {
  return (
    <Card className="gap-4 px-3 pt-4 pb-3">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon icon={Wallet01Icon} className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="font-heading text-base font-semibold">Contas manuais</span>
          <span className="text-xs text-muted-foreground">
            {plural(accounts.length, "conta", "contas")} · você atualiza o saldo
          </span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {accounts.map((account) => (
          <AccountTile key={account.id} account={account} editable />
        ))}
      </div>
    </Card>
  );
}

function ConnectBankButton({ hasBanks }: { hasBanks: boolean }) {
  const { connect, isBusy } = usePluggyConnect();

  return (
    <button
      type="button"
      onClick={connect}
      disabled={isBusy}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-4xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon icon={Add01Icon} className="size-4" />
      {isBusy ? "Abrindo conexão segura..." : hasBanks ? "Conectar outro banco" : "Conectar banco"}
    </button>
  );
}

function StatusFilterChip({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <div>
      <Link
        href="/accounts"
        className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card pr-2 pl-3 text-xs font-medium transition-colors hover:bg-muted"
        aria-label={`Remover filtro ${meta.label}`}
      >
        <span className={`size-1.5 rounded-full ${meta.dotClassName}`} />
        {meta.label}
        <Icon icon={Cancel01Icon} className="size-3.5 text-muted-foreground" />
      </Link>
    </div>
  );
}

function FilteredEmpty({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <Card className="flex-row items-center gap-4 px-5 py-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon icon={Wallet01Icon} className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-heading text-base font-semibold">Nenhuma conta {meta.shortLabel.toLowerCase()}</span>
        <span className="text-xs text-muted-foreground">
          Nada por aqui com esse status. Ajuste o vencimento ou marque como paga na edição da conta.
        </span>
      </div>
      <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/accounts" />}>
        Ver todas
      </Button>
    </Card>
  );
}

function AccountListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-3 px-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-3 w-24" />
      </Card>
      <Card className="gap-4 px-3 pt-4 pb-3">
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="size-10 rounded-2xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </Card>
    </div>
  );
}

export function AccountList() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter = isPaymentStatus(statusParam) ? statusParam : null;

  const { data: accounts = [], isPending, isError, error, refetch } = useAccounts();
  const { data: connections = [], isPending: isConnectionsPending } = usePluggyConnections();

  if (isPending || isConnectionsPending) return <AccountListSkeleton />;

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

  const visibleAccounts = statusFilter
    ? accounts.filter((account) => getPaymentStatus(account) === statusFilter)
    : accounts;
  const { banks, manual } = groupAccounts(visibleAccounts, connections);
  const allBanks = groupAccounts(accounts, connections).banks;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <SummaryCard accounts={accounts} bankCount={allBanks.length} connections={connections} />

        {statusFilter ? <StatusFilterChip status={statusFilter} /> : null}

        {statusFilter && visibleAccounts.length === 0 ? (
          <FilteredEmpty status={statusFilter} />
        ) : (
          <>
            {banks.map((group) => (
              <BankGroupCard key={group.key} group={group} />
            ))}
            {manual.length > 0 ? <ManualGroupCard accounts={manual} /> : null}
          </>
        )}

        {!statusFilter ? (
          accounts.length === 0 ? (
            <Card className="items-center gap-2 px-6 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icon icon={BankIcon} className="size-5" />
              </span>
              <span className="font-heading text-base font-semibold">Nenhuma conta ainda</span>
              <span className="max-w-sm text-xs text-muted-foreground">
                Conecte seu banco para trazer saldo e transações automaticamente, ou cadastre uma conta manual em
                &ldquo;Nova conta&rdquo;.
              </span>
            </Card>
          ) : null
        ) : null}

        {!statusFilter ? <ConnectBankButton hasBanks={allBanks.length > 0} /> : null}
      </div>
    </TooltipProvider>
  );
}
