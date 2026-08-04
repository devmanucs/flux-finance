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
import { type Account, useDeleteAccount } from "../api/queries";

export function DeleteAccountButton({ account }: { account: Account }) {
  const { mutate, isPending } = useDeleteAccount();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Excluir ${account.name}`} />}
      >
        <Icon icon={Delete02Icon} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{account.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso também apaga todas as transações lançadas nessa conta. Não dá pra desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => mutate({ id: String(account.id) })}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
