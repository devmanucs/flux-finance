"use client";

import type { Category } from "@flux-finance/database";
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
import { useDeleteCategory } from "../api/queries";

export function DeleteCategoryButton({ category }: { category: Category }) {
  const { mutate, isPending } = useDeleteCategory();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${category.name}`} />
        }
      >
        <Icon icon={Delete02Icon} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Transações que usavam essa categoria ficam sem categoria. Não dá pra desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => mutate({ id: String(category.id) })}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
