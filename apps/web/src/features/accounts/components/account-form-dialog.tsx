"use client";

import { FormFields } from "@/components/forms/form-fields";
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
import { type Account, useCreateAccount, useUpdateAccount } from "../api/queries";
import {
  accountSchema,
  accountTypeOptions,
  RESERVABLE_ACCOUNT_TYPES,
  type AccountFormValues,
} from "../schemas/account-schema";

function toFormValues(account?: Account): AccountFormValues {
  return {
    name: account?.name ?? "",
    type: account?.type ?? "CHECKING",
    balance: account ? Number(account.balance) : 0,
    currency: account?.currency ?? "BRL",
    dueDay: account?.dueDay ?? null,
    isPaid: account?.isPaid ?? false,
    isReserved: account?.isReserved ?? false,
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
      dueDay:
        values.dueDay === "" || values.dueDay == null ? null : Number(values.dueDay),
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
              allowNegative
            />
            {RESERVABLE_ACCOUNT_TYPES.includes(
              accountType as (typeof RESERVABLE_ACCOUNT_TYPES)[number],
            ) && (
              <FormFields.Switch<AccountFormValues>
                name="isReserved"
                label="Guardado (não conta no saldo total)"
              />
            )}
            <FormFields.Input<AccountFormValues>
              name="dueDay"
              label="Dia do vencimento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex.: 22"
            />
            <FormFields.Switch<AccountFormValues> name="isPaid" label="Fatura atual já paga" />
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
