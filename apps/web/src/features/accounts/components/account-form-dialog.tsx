"use client";

import type { Account } from "@flux-finance/database";
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
import { useCreateAccount, useUpdateAccount } from "../api/queries";
import { accountSchema, accountTypeOptions, type AccountFormValues } from "../schemas/account-schema";

export function AccountFormDialog({
  trigger,
  account,
}: {
  trigger: ReactNode;
  account?: Account;
}) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(account);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "CHECKING",
      balance: account ? Number(account.balance) : 0,
      currency: account?.currency ?? "BRL",
    },
  });

  const { mutate: createAccount, isPending: isCreating } = useCreateAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount();
  const isPending = isCreating || isUpdating;

  const onSubmit = form.handleSubmit((values) => {
    if (isEditing && account) {
      updateAccount(
        { id: String(account.id), formData: values },
        { onSuccess: () => setOpen(false) },
      );
      return;
    }

    createAccount(
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
          <DialogTitle>{isEditing ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da conta/cartão."
              : "Cadastre um banco, cartão ou carteira."}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormFields.Input<AccountFormValues>
              name="name"
              label="Nome"
              placeholder="Ex.: Nubank, Itaú Crédito..."
            />
            <FormFields.Select<AccountFormValues>
              name="type"
              label="Tipo"
              options={accountTypeOptions}
            />
            <FormFields.Input<AccountFormValues>
              name="balance"
              label={
                form.watch("type") === "CREDIT_CARD"
                  ? "Fatura atual (quanto você deve)"
                  : "Saldo atual"
              }
              type="number"
              step="0.01"
            />
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
