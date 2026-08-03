"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@flux-finance/ui/components/ui/alert-dialog";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { useDeleteTransaction, type TransactionWithCategory } from "../api/queries";

export function DeleteTransactionButton({
  transaction,
}: {
  transaction: TransactionWithCategory;
}) {
  const { mutate, isPending } = useDeleteTransaction();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Excluir ${transaction.description}`}
          />
        }
      >
        <Icon icon={Delete02Icon} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{transaction.description}”?</AlertDialogTitle>
          <AlertDialogDescription>
            O saldo da conta volta ao valor anterior a esse lançamento. Não dá pra desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" />}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            render={<Button variant="destructive" disabled={isPending} />}
            onClick={() => mutate({ id: String(transaction.id) })}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
