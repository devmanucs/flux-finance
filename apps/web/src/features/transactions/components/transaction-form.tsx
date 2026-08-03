"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@flux-finance/ui/components/ui/button";
import { FormFields } from "@/components/forms/form-fields";
import { useCreateTransaction } from "../api/queries";
import {
  DEMO_ACCOUNT_ID,
  transactionKindOptions,
  transactionSchema,
  type TransactionFormValues,
} from "../schemas/transaction-schema";

export function TransactionForm() {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: DEMO_ACCOUNT_ID,
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
          form.reset({ ...values, description: "", amount: 0 });
        },
      },
    );
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Adicionar transação"}
        </Button>
      </form>
    </FormProvider>
  );
}
