"use client";

import { MoneyExchange01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardContent } from "@flux-finance/ui/components/ui/card";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flux-finance/ui/components/ui/table";
import { EmptyState, ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { formatMoney } from "@/lib/format-money";
import { useTransactions, type TransactionWithCategory } from "../api/queries";
import { DeleteTransactionButton } from "./delete-transaction-button";

function TransactionRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
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

export function TransactionList({
  onEdit,
}: {
  onEdit?: (transaction: TransactionWithCategory) => void;
}) {
  const { data: transactions = [], isPending, isError, error, refetch } = useTransactions();

  return (
    <Card>
      <CardContent>
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
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
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.category?.name ?? "—"}
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
                        {onEdit ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${transaction.description}`}
                            onClick={() => onEdit(transaction)}
                          >
                            <Icon icon={PencilEdit02Icon} />
                          </Button>
                        ) : null}
                        <DeleteTransactionButton transaction={transaction} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
