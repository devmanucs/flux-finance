"use client";

import { Badge } from "@flux-finance/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flux-finance/ui/components/ui/table";
import { useTransactions } from "../api/queries";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function TransactionList() {
  const { data: transactions = [], isPending } = useTransactions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.category?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.kind === "INCOME" ? "default" : "destructive"}>
                      {transaction.kind === "INCOME" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* amount chega como Decimal (Prisma) -> string via JSON */}
                    {currency.format(Number(transaction.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
