"use client";

import type { Account } from "@flux-finance/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@flux-finance/ui/components/ui/button";
import { FormFields } from "@/components/forms/form-fields";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type TransactionWithCategory,
} from "../api/queries";
import {
  transactionKindOptions,
  transactionSchema,
  type TransactionFormValues,
} from "../schemas/transaction-schema";

function toFormValues(
  accounts: Account[],
  transaction?: TransactionWithCategory,
): TransactionFormValues {
  return {
    accountId: transaction?.accountId ?? accounts[0]?.id ?? 0,
    categoryId: transaction?.categoryId ?? undefined,
    description: transaction?.description ?? "",
    amount: transaction ? Number(transaction.amount) : 0,
    kind: transaction?.kind ?? "EXPENSE",
  };
}

function TransactionFormInner({
  accounts,
  transaction,
  onSuccess,
  onCancel,
}: {
  accounts: Account[];
  transaction?: TransactionWithCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const isEditing = Boolean(transaction);
  const { data: categories = [] } = useCategories();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: toFormValues(accounts, transaction),
  });

  const { mutate: createTransaction, isPending: isCreating } = useCreateTransaction();
  const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    form.reset(toFormValues(accounts, transaction));
  }, [accounts, transaction, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (isEditing && transaction) {
      updateTransaction(
        { id: String(transaction.id), formData: values },
        { onSuccess: () => onSuccess?.() },
      );
      return;
    }

    createTransaction(
      { formData: values },
      {
        onSuccess: () => {
          form.reset({ ...values, description: "", amount: 0, categoryId: undefined });
          onSuccess?.();
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
        <FormFields.Money<TransactionFormValues> name="amount" label="Valor" />
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
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Adicionar transação"}
          </Button>
          {isEditing && onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar edição
            </Button>
          ) : null}
        </div>
      </form>
    </FormProvider>
  );
}

export function TransactionForm({
  transaction,
  onSuccess,
  onCancel,
}: {
  transaction?: TransactionWithCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
} = {}) {
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

  return (
    <TransactionFormInner
      accounts={accounts}
      transaction={transaction}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
