"use client";

import type { Account } from "@flux-finance/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@flux-finance/ui/components/ui/button";
import { FormFields } from "@/components/forms/form-fields";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import { useCreateTransaction } from "../api/queries";
import {
  transactionKindOptions,
  transactionSchema,
  type TransactionFormValues,
} from "../schemas/transaction-schema";

function TransactionFormInner({ accounts }: { accounts: Account[] }) {
  const { data: categories = [] } = useCategories();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: accounts[0]?.id,
      description: "",
      amount: 0,
      kind: "EXPENSE",
    },
  });

  const { mutate, isPending } = useCreateTransaction();

  const onSubmit = form.handleSubmit((values) => {
    mutate(
      { formData: values },
      {
        onSuccess: () => {
          form.reset({ ...values, description: "", amount: 0, categoryId: undefined });
        },
      },
    );
  });

  const accountOptions = accounts.map((account) => ({
    value: String(account.id),
    label: account.name,
  }));

  const kind = form.watch("kind");
  const categoryOptions = categories
    .filter((category) => category.kind === kind)
    .map((category) => ({ value: String(category.id), label: category.name }));

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormFields.Select<TransactionFormValues>
          name="accountId"
          label="Conta"
          options={accountOptions}
        />
        <FormFields.Input<TransactionFormValues>
          name="description"
          label="Descrição"
          placeholder="Ex.: Mercado"
        />
        <FormFields.Input<TransactionFormValues>
          name="amount"
          label="Valor"
          type="number"
          step="0.01"
          min={0}
        />
        <FormFields.Select<TransactionFormValues>
          name="kind"
          label="Tipo"
          options={transactionKindOptions}
        />
        <FormFields.Select<TransactionFormValues>
          name="categoryId"
          label="Categoria (opcional)"
          placeholder="Sem categoria"
          options={categoryOptions}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Adicionar transação"}
        </Button>
      </form>
    </FormProvider>
  );
}

export function TransactionForm() {
  const { data: accounts = [], isPending } = useAccounts();

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando contas...</p>;
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre uma conta primeiro (em “Contas”) pra poder lançar transações.
      </p>
    );
  }

  return <TransactionFormInner accounts={accounts} />;
}
