"use client";

import type { Category } from "@flux-finance/database";
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
import { useDeleteCategory } from "../api/queries";

export function DeleteCategoryButton({ category }: { category: Category }) {
  const { mutate, isPending } = useDeleteCategory();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
        Excluir
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Transações que usavam essa categoria ficam sem categoria. Não dá pra desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" />}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            render={<Button variant="destructive" disabled={isPending} />}
            onClick={() => mutate({ id: String(category.id) })}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
