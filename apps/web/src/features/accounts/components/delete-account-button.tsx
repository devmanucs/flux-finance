"use client";

import type { Account } from "@flux-finance/database";
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
import { useDeleteAccount } from "../api/queries";

export function DeleteAccountButton({ account }: { account: Account }) {
  const { mutate, isPending } = useDeleteAccount();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
        Excluir
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{account.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso também apaga todas as transações lançadas nessa conta. Não dá pra desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" />}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            render={<Button variant="destructive" disabled={isPending} />}
            onClick={() => mutate({ id: String(account.id) })}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
