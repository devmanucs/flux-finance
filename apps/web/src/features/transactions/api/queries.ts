import type { Transaction } from "@flux-finance/database";
import { useCreate, useDelete, useFetch, useUpdate } from "@/lib/hooks/use-crud";
import type { TransactionFormValues } from "../schemas/transaction-schema";

const ROUTE = "/transactions";
const QUERY_KEY = "transactions";

export function useTransactions() {
  return useFetch<Transaction[]>({
    queryKey: [QUERY_KEY],
    route: ROUTE,
  });
}

export function useCreateTransaction() {
  return useCreate<Transaction, TransactionFormValues>({
    route: ROUTE,
    mutationKey: ["criar-transacao"],
    queryInvalidationKeys: [QUERY_KEY],
  });
}

export function useUpdateTransaction() {
  return useUpdate<Transaction, Partial<TransactionFormValues>>({
    route: ROUTE,
    mutationKey: ["atualizar-transacao"],
    queryInvalidationKeys: [QUERY_KEY],
  });
}

export function useDeleteTransaction() {
  return useDelete({
    route: ROUTE,
    mutationKey: ["excluir-transacao"],
    queryInvalidationKeys: [QUERY_KEY],
  });
}
