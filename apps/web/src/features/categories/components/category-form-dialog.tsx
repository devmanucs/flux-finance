"use client";

import type { Category } from "@flux-finance/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@flux-finance/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@flux-finance/ui/components/ui/dialog";
import { FormFields } from "@/components/forms/form-fields";
import { useCreateCategory, useUpdateCategory } from "../api/queries";
import { categoryKindOptions, categorySchema, type CategoryFormValues } from "../schemas/category-schema";

export function CategoryFormDialog({
  trigger,
  category,
}: {
  trigger: ReactNode;
  category?: Category;
}) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      kind: category?.kind ?? "EXPENSE",
      color: category?.color ?? "#94a3b8",
    },
  });

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const isPending = isCreating || isUpdating;

  const onSubmit = form.handleSubmit((values) => {
    if (isEditing && category) {
      updateCategory(
        { id: String(category.id), formData: values },
        { onSuccess: () => setOpen(false) },
      );
      return;
    }

    createCategory(
      { formData: values },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            Categorias organizam suas transações pros relatórios e dashboards.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormFields.Input<CategoryFormValues>
              name="name"
              label="Nome"
              placeholder="Ex.: Alimentação, Transporte..."
            />
            <FormFields.Select<CategoryFormValues>
              name="kind"
              label="Tipo"
              options={categoryKindOptions}
            />
            <FormFields.Input<CategoryFormValues> name="color" label="Cor" type="color" />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
