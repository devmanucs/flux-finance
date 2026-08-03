"use client";

import { FormFields } from "@/components/forms/form-fields";
import type { Account } from "@flux-finance/database";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useCreateAccount, useUpdateAccount } from "../api/queries";
import { toDateInputValue } from "../lib/payment-status";
import {
  accountSchema,
  accountTypeOptions,
  type AccountFormValues,
} from "../schemas/account-schema";

function toFormValues(account?: Account): AccountFormValues {
  return {
    name: account?.name ?? "",
    type: account?.type ?? "CHECKING",
    balance: account ? Number(account.balance) : 0,
    currency: account?.currency ?? "BRL",
    dueDate: toDateInputValue(account?.dueDate),
    isPaid: account?.isPaid ?? false,
  };
}

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
    defaultValues: toFormValues(account),
  });

  const { mutate: createAccount, isPending: isCreating } = useCreateAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount();
  const isPending = isCreating || isUpdating;
  const accountType = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(account));
    }
  }, [open, account, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      ...values,
      dueDate: values.dueDate
        ? new Date(`${values.dueDate}T12:00:00`).toISOString()
        : null,
    };

    if (isEditing && account) {
      updateAccount(
        { id: String(account.id), formData: payload },
        { onSuccess: () => setOpen(false) },
      );
      return;
    }

    createAccount(
      { formData: payload },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset(toFormValues());
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
            <FormFields.Money<AccountFormValues>
              name="balance"
              label={
                accountType === "CREDIT_CARD"
                  ? "Fatura atual (quanto você deve)"
                  : "Saldo atual"
              }
            />
            <FormFields.Date<AccountFormValues>
              name="dueDate"
              label="Vencimento"
              placeholder="Selecionar vencimento"
            />
            <FormFields.Switch<AccountFormValues> name="isPaid" label="Já paga" />
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
