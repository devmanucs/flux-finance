"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowDownLeft01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  MoneyExchange01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card } from "@flux-finance/ui/components/ui/card";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flux-finance/ui/components/ui/select";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flux-finance/ui/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flux-finance/ui/components/ui/tooltip";
import { EmptyState, ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { cn } from "@flux-finance/ui/lib/utils";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { getPaymentStatus, isPaymentStatus, PAYMENT_STATUS_META } from "@/lib/payment-status";
import { useTransactions, useUpdateTransaction, type TransactionWithCategory } from "../api/queries";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { TransactionFormSheet } from "./transaction-form-sheet";

const PAGE_SIZE = 12;
const COMPACT_SIZE = 5;
const MAX_TIMELINE_WEEKS = 40;

function buildMonthOptions() {
  const options: { value: string; label: string }[] = [{ value: "", label: "Todos os meses" }];
  const now = new Date();

  for (let offset = -11; offset <= 3; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rawLabel = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) });
  }

  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function formatShortDate(value: Date | string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Extratos de banco terminam com "- DOCTO: 123456"; o número vai para um
// selo discreto ao lado, para a descrição caber na linha.
function splitDescription(description: string) {
  const match = description.match(/^(.*?)\s*-?\s*DOCTO:\s*(\S+)\s*$/i);
  if (!match?.[1]) return { text: description, code: null };
  return { text: match[1].trim(), code: match[2] ?? null };
}

function startOfWeek(value: Date | string) {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7; // segunda = 0
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

function TransactionStatusDot({ transaction }: { transaction: TransactionWithCategory }) {
  const { mutate, isPending } = useUpdateTransaction();
  const status = getPaymentStatus(transaction);

  if (!status) return <span className="inline-block size-5" />;

  const meta = PAYMENT_STATUS_META[status];
  const isSynced = Boolean(transaction.pluggyTransactionId);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            disabled={isPending || isSynced}
            className="inline-flex size-5 items-center justify-center rounded-full disabled:cursor-default"
            aria-label={isSynced
              ? `${meta.shortLabel} — status sincronizado pelo banco`
              : `${meta.shortLabel} — clique para marcar como ${transaction.isPaid ? "não paga" : "paga"}`}
            onClick={() =>
              isSynced
                ? undefined
                : mutate({
                    id: String(transaction.id),
                    formData: { isPaid: !transaction.isPaid },
                  })
            }
          />
        }
      >
        <span className={`size-2 rounded-full ${meta.dotClassName}`} />
      </TooltipTrigger>
      <TooltipContent>
        {isSynced ? `${meta.shortLabel} — status sincronizado pelo banco` : `${meta.shortLabel} — clique para alternar`}
      </TooltipContent>
    </Tooltip>
  );
}

function DirectionIcon({ kind }: { kind: TransactionWithCategory["kind"] }) {
  const isIncome = kind === "INCOME";
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-lg",
        isIncome
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
      )}
      aria-label={isIncome ? "Receita" : "Despesa"}
    >
      <Icon icon={isIncome ? ArrowDownLeft01Icon : ArrowUpRight01Icon} className="size-3.5" />
    </span>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionWithCategory }) {
  const { text, code } = splitDescription(transaction.description);
  const isIncome = transaction.kind === "INCOME";

  return (
    <TableRow className="group/row border-border/50">
      <TableCell className="w-8 py-2.5 pr-0 pl-4">
        <TransactionStatusDot transaction={transaction} />
      </TableCell>
      <TableCell className="w-10 py-2.5 pr-0">
        <DirectionIcon kind={transaction.kind} />
      </TableCell>
      <TableCell className="max-w-0 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-medium" title={transaction.description}>
            {text}
          </span>
          {code ? <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{code}</span> : null}
        </div>
      </TableCell>
      <TableCell className="hidden py-2.5 text-muted-foreground md:table-cell">
        {transaction.category?.name ?? "—"}
      </TableCell>
      <TableCell className="hidden py-2.5 text-muted-foreground tabular-nums sm:table-cell">
        {formatDate(transaction.date)}
      </TableCell>
      <TableCell
        className={cn(
          "py-2.5 text-right font-medium tabular-nums",
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
        )}
      >
        {isIncome ? "+" : "-"}
        {formatMoney(transaction.amount)}
      </TableCell>
      <TableCell className="w-20 py-2.5 pr-3 pl-0 text-right">
        <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 max-md:opacity-100">
          <TransactionFormSheet
            transaction={transaction}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Editar ${transaction.description}`}>
                <Icon icon={PencilEdit02Icon} />
              </Button>
            }
          />
          {!transaction.pluggyTransactionId ? <DeleteTransactionButton transaction={transaction} /> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function TransactionRowSkeleton() {
  return (
    <TableRow className="border-border/50">
      <TableCell className="py-3 pl-4">
        <Skeleton className="size-2 rounded-full" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="size-7 rounded-lg" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell className="hidden py-3 md:table-cell">
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="hidden py-3 sm:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="ml-auto h-4 w-16" />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

// Uma barra por semana (mais recente à esquerda, como a lista); a altura é o
// volume de lançamentos e as barras acesas são as semanas da página atual.
function PageTimeline({
  transactions,
  pageStart,
  pageEnd,
  onSelectPage,
}: {
  transactions: TransactionWithCategory[];
  pageStart: number;
  pageEnd: number;
  onSelectPage: (page: number) => void;
}) {
  if (transactions.length === 0) return null;

  const weeks = new Map<number, { count: number; firstIndex: number }>();
  transactions.forEach((transaction, index) => {
    const key = startOfWeek(transaction.date).getTime();
    const week = weeks.get(key);
    if (week) week.count += 1;
    else weeks.set(key, { count: 1, firstIndex: index });
  });

  const newest = startOfWeek(transactions[0]!.date);
  const oldest = startOfWeek(transactions[transactions.length - 1]!.date);
  const bars: Array<{ start: Date; count: number; firstIndex: number | null }> = [];
  for (
    let cursor = newest;
    cursor >= oldest && bars.length < MAX_TIMELINE_WEEKS;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 7)
  ) {
    const week = weeks.get(cursor.getTime());
    bars.push({ start: cursor, count: week?.count ?? 0, firstIndex: week?.firstIndex ?? null });
  }

  const max = Math.max(...bars.map((bar) => bar.count), 1);
  const pageNewest = startOfWeek(transactions[pageStart]!.date).getTime();
  const pageOldest = startOfWeek(transactions[Math.max(pageStart, pageEnd - 1)]!.date).getTime();

  return (
    <div className="hidden min-w-0 flex-1 justify-center md:flex" aria-hidden>
      <div className="flex items-end gap-[3px] overflow-hidden">
        {bars.map((bar, index) => {
          const time = bar.start.getTime();
          const isActive = time <= pageNewest && time >= pageOldest;
          const previous = bars[index - 1];
          const showMonth = !previous || previous.start.getMonth() !== bar.start.getMonth();
          const page = bar.firstIndex === null ? null : Math.floor(bar.firstIndex / PAGE_SIZE) + 1;

          return (
            <button
              key={time}
              type="button"
              tabIndex={-1}
              disabled={page === null}
              onClick={() => page && onSelectPage(page)}
              className="group/bar flex w-2.5 flex-col items-start gap-1 disabled:cursor-default"
            >
              <span className="flex h-6 w-full items-end">
                <span
                  className={cn(
                    "w-full rounded-[3px] transition-colors",
                    isActive ? "bg-foreground" : "bg-muted-foreground/25 group-enabled/bar:group-hover/bar:bg-muted-foreground/50",
                  )}
                  style={{ height: bar.count === 0 ? 3 : 6 + (bar.count / max) * 18 }}
                />
              </span>
              <span className="h-3 text-[10px] leading-3 whitespace-nowrap text-muted-foreground">
                {showMonth ? bar.start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TransactionList({
  variant = "full",
  title = "Transações",
  actions,
}: {
  variant?: "full" | "compact";
  title?: string;
  actions?: ReactNode;
}) {
  const isCompact = variant === "compact";
  const [month, setMonth] = useState("");
  const { data: transactions = [], isPending, isError, error, refetch } = useTransactions(month);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter = isPaymentStatus(statusParam) ? statusParam : null;

  const filteredTransactions = statusFilter
    ? transactions.filter((transaction) => getPaymentStatus(transaction) === statusFilter)
    : transactions;

  // A página fica amarrada ao filtro: trocou mês/status, volta pra página 1.
  const filterKey = `${month}|${statusFilter ?? ""}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number | ((current: number) => number)) =>
    setPageState({ key: filterKey, page: typeof next === "function" ? next(page) : next });
  const pageSize = isCompact ? COMPACT_SIZE : PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = isCompact ? 1 : Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(filteredTransactions.length, pageStart + pageSize);
  const visibleTransactions = filteredTransactions.slice(pageStart, pageEnd);

  const allHref = statusFilter ? `/transactions?status=${statusFilter}` : "/transactions";

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {isCompact ? (
            <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
          ) : (
            <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
          )}
          <div className="flex items-center gap-2">
            <Select items={MONTH_OPTIONS} value={month} onValueChange={(value) => setMonth(value ?? "")}>
              <SelectTrigger className="w-auto min-w-36 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value || "all"} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {actions}
          </div>
        </div>

        {statusFilter && !isCompact ? (
          <div>
            <Link
              href={pathname}
              className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card pr-2 pl-3 text-xs font-medium transition-colors hover:bg-muted"
              aria-label={`Remover filtro ${PAYMENT_STATUS_META[statusFilter].label}`}
            >
              <span className={`size-1.5 rounded-full ${PAYMENT_STATUS_META[statusFilter].dotClassName}`} />
              {PAYMENT_STATUS_META[statusFilter].label}
              <Icon icon={Cancel01Icon} className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
        ) : null}

        {isError ? (
          isPermissionError(error) ? (
            <UnauthorizedState description="Você precisa entrar novamente para ver suas transações." />
          ) : (
            <ErrorState
              description={`Não foi possível carregar suas transações${getErrorStatus(error) ? ` (erro ${getErrorStatus(error)})` : ""}.`}
              onRetry={() => refetch()}
            />
          )
        ) : !isPending && transactions.length === 0 ? (
          <EmptyState
            icon={MoneyExchange01Icon}
            title="Nenhuma transação ainda"
            description="Conecte um banco ou lance sua primeira receita ou despesa para começar a ver seu fluxo de caixa."
          />
        ) : !isPending && filteredTransactions.length === 0 && statusFilter ? (
          <EmptyState
            icon={MoneyExchange01Icon}
            title={`Nenhuma transação ${PAYMENT_STATUS_META[statusFilter].shortLabel.toLowerCase()}`}
            description="Nada por aqui com esse status."
            action={
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href={pathname} />}>
                Ver todas
              </Button>
            }
          />
        ) : (
          <Card className="gap-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="h-10 pl-4" />
                  <TableHead className="h-10" />
                  <TableHead className="h-10 text-xs font-normal text-muted-foreground">Descrição</TableHead>
                  <TableHead className="hidden h-10 text-xs font-normal text-muted-foreground md:table-cell">
                    Categoria
                  </TableHead>
                  <TableHead className="hidden h-10 text-xs font-normal text-muted-foreground sm:table-cell">
                    Data
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-normal text-muted-foreground">Valor</TableHead>
                  <TableHead className="h-10 pr-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: isCompact ? 3 : 6 }, (_, index) => <TransactionRowSkeleton key={index} />)
                  : visibleTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
              </TableBody>
            </Table>

            {!isPending && filteredTransactions.length > 0 ? (
              <div className="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-3">
                {isCompact ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Últimas {visibleTransactions.length} de {filteredTransactions.length}
                    </span>
                    <Link
                      href={allHref}
                      className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-muted-foreground"
                    >
                      Ver todas as transações
                      <Icon icon={ArrowRight01Icon} className="size-3.5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex shrink-0 flex-col">
                      <span className="text-xs font-semibold tabular-nums">
                        {pageStart + 1}–{pageEnd} de {filteredTransactions.length}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatShortDate(filteredTransactions[pageEnd - 1]!.date)} –{" "}
                        {formatShortDate(filteredTransactions[pageStart]!.date)}
                      </span>
                    </div>
                    <PageTimeline
                      transactions={filteredTransactions}
                      pageStart={pageStart}
                      pageEnd={pageEnd}
                      onSelectPage={setPage}
                    />
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Página anterior"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <Icon icon={ArrowLeft01Icon} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Próxima página"
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                      >
                        <Icon icon={ArrowRight01Icon} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
