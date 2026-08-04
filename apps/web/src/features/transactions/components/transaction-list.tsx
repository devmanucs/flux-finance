"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoneyExchange01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
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
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { getPaymentStatus, isPaymentStatus, PAYMENT_STATUS_META } from "@/lib/payment-status";
import { useTransactions, useUpdateTransaction, type TransactionWithCategory } from "../api/queries";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { TransactionFormSheet } from "./transaction-form-sheet";

const PAGE_SIZE = 20;

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

function TransactionStatusDot({ transaction }: { transaction: TransactionWithCategory }) {
  const { mutate, isPending } = useUpdateTransaction();
  const status = getPaymentStatus(transaction);

  if (!status) return null;

  const meta = PAYMENT_STATUS_META[status];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            disabled={isPending}
            className="inline-flex size-5 items-center justify-center rounded-full disabled:opacity-50"
            aria-label={`${meta.shortLabel} — clique para marcar como ${transaction.isPaid ? "não paga" : "paga"}`}
            onClick={() =>
              mutate({
                id: String(transaction.id),
                formData: { isPaid: !transaction.isPaid },
              })
            }
          />
        }
      >
        <span className={`size-2.5 rounded-full ${meta.dotClassName}`} />
      </TooltipTrigger>
      <TooltipContent>{meta.shortLabel} — clique para alternar</TooltipContent>
    </Tooltip>
  );
}

function TransactionRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="size-2.5 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TransactionList() {
  const [month, setMonth] = useState("");
  const { data: transactions = [], isPending, isError, error, refetch } = useTransactions(month);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter = isPaymentStatus(statusParam) ? statusParam : null;

  const filteredTransactions = statusFilter
    ? transactions.filter((transaction) => getPaymentStatus(transaction) === statusFilter)
    : transactions;

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [month, statusFilter]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">Histórico</CardTitle>
          <CardAction>
            <Select
              items={MONTH_OPTIONS}
              value={month}
              onValueChange={(value) => setMonth(value ?? "")}
            >
              <SelectTrigger className="w-[180px]">
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
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {statusFilter ? (
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  className={`inline-block size-2 rounded-full ${PAYMENT_STATUS_META[statusFilter].dotClassName}`}
                />
                Filtrando: {PAYMENT_STATUS_META[statusFilter].label}
              </p>
              <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={pathname} />}>
                Limpar filtro
              </Button>
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
              description="Lance sua primeira receita ou despesa pelo formulário ao lado para começar a ver seu fluxo de caixa."
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <>
                    <TransactionRowSkeleton />
                    <TransactionRowSkeleton />
                    <TransactionRowSkeleton />
                  </>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <TransactionStatusDot transaction={transaction} />
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.category?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.kind === "INCOME" ? "Receita" : "Despesa"}
                      </TableCell>
                      <TableCell
                        className={
                          transaction.kind === "INCOME"
                            ? "text-right font-medium text-emerald-600 dark:text-emerald-400"
                            : "text-right font-medium text-destructive"
                        }
                      >
                        {formatMoney(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TransactionFormSheet
                            transaction={transaction}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Editar ${transaction.description}`}
                              >
                                <Icon icon={PencilEdit02Icon} />
                              </Button>
                            }
                          />
                          <DeleteTransactionButton transaction={transaction} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {!isPending && pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {pageCount} · {filteredTransactions.length} transações
              </p>
              <div className="flex items-center gap-1">
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
            </div>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
