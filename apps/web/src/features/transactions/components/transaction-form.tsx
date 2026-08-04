"use client";

import type { Account } from "@/features/accounts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@flux-finance/ui/components/ui/button";
import { FormFields } from "@/components/forms/form-fields";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import {
  useCreateRecurringTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  type TransactionWithCategory,
} from "../api/queries";
import {
  transactionKindOptions,
  transactionSchema,
  type TransactionFormValues,
} from "../schemas/transaction-schema";

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    date: toDateInputValue(transaction?.date) || toDateInputValue(new Date()),
    dueDate: toDateInputValue(transaction?.dueDate),
    isPaid: transaction?.isPaid ?? false,
    isRecurring: false,
    repeatEveryMonths: 1,
    occurrences: 12,
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
  const { mutate: createRecurringTransaction, isPending: isCreatingRecurring } =
    useCreateRecurringTransaction();
  const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
  const isPending = isCreating || isCreatingRecurring || isUpdating;

  useEffect(() => {
    form.reset(toFormValues(accounts, transaction));
  }, [accounts, transaction, form]);

  const onSubmit = form.handleSubmit((values) => {
    const { isRecurring, repeatEveryMonths, occurrences, ...rest } = values;
    const basePayload = {
      ...rest,
      date: new Date(`${values.date}T12:00:00`).toISOString(),
      dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : null,
    };

    if (isEditing && transaction) {
      updateTransaction(
        { id: String(transaction.id), formData: basePayload },
        { onSuccess: () => onSuccess?.() },
      );
      return;
    }

    const onCreateSuccess = () => {
      form.reset({
        ...values,
        description: "",
        amount: 0,
        categoryId: undefined,
        dueDate: "",
        isPaid: false,
        isRecurring: false,
      });
      onSuccess?.();
    };

    if (isRecurring) {
      createRecurringTransaction(
        { formData: { ...basePayload, repeatEveryMonths, occurrences } },
        { onSuccess: onCreateSuccess },
      );
      return;
    }

    createTransaction({ formData: basePayload }, { onSuccess: onCreateSuccess });
  });

  const accountOptions = accounts.map((account) => ({
    value: String(account.id),
    label: account.name,
  }));

  const kind = form.watch("kind");
  const isRecurring = form.watch("isRecurring");
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
          placeholder={
            categoryOptions.length === 0
              ? `Nenhuma categoria de ${kind === "INCOME" ? "receita" : "despesa"} cadastrada`
              : "Sem categoria"
          }
          options={categoryOptions}
        />
        <FormFields.Date<TransactionFormValues>
          name="date"
          label="Data"
          placeholder="Selecionar data"
        />
        <FormFields.Date<TransactionFormValues>
          name="dueDate"
          label="Vencimento (opcional)"
          placeholder="Selecionar vencimento"
        />
        <FormFields.Switch<TransactionFormValues> name="isPaid" label="Já paga" />
        {!isEditing ? (
          <>
            <FormFields.Switch<TransactionFormValues>
              name="isRecurring"
              label="Repetir (aluguel, água...)"
            />
            {isRecurring ? (
              <div className="grid grid-cols-2 gap-4">
                <FormFields.Input<TransactionFormValues>
                  name="repeatEveryMonths"
                  label="A cada quantos meses"
                  type="number"
                  min={1}
                  max={24}
                />
                <FormFields.Input<TransactionFormValues>
                  name="occurrences"
                  label="Quantidade de repetições"
                  type="number"
                  min={2}
                  max={60}
                />
              </div>
            ) : null}
          </>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : isRecurring
                  ? "Adicionar transações"
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
