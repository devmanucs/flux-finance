import type { Prisma, Transaction } from "@flux-finance/database";
import { ACCOUNTS_QUERY_KEY } from "@/features/accounts/api/queries";
import { useCreate, useDelete, useFetch, useUpdate } from "@/lib/hooks/use-crud";
import type { TransactionFormValues } from "../schemas/transaction-schema";

const ROUTE = "/transactions";
export const TRANSACTIONS_QUERY_KEY = "transactions";

const INVALIDATION_KEYS = [
  TRANSACTIONS_QUERY_KEY,
  ACCOUNTS_QUERY_KEY,
  "dashboard-summary",
  "dashboard-cashflow",
  "dashboard-by-category",
];

export type TransactionWithCategory = Prisma.TransactionGetPayload<{
  include: { category: true };
}>;

export function useTransactions() {
  return useFetch<TransactionWithCategory[]>({
    queryKey: [TRANSACTIONS_QUERY_KEY],
    route: ROUTE,
  });
}

export function useCreateTransaction() {
  return useCreate<Transaction, TransactionFormValues>({
    route: ROUTE,
    mutationKey: ["criar-transacao"],
    queryInvalidationKeys: INVALIDATION_KEYS,
  });
}

export function useUpdateTransaction() {
  return useUpdate<Transaction, Partial<TransactionFormValues>>({
    route: ROUTE,
    mutationKey: ["atualizar-transacao"],
    queryInvalidationKeys: INVALIDATION_KEYS,
  });
}

export function useDeleteTransaction() {
  return useDelete({
    route: ROUTE,
    mutationKey: ["excluir-transacao"],
    queryInvalidationKeys: INVALIDATION_KEYS,
  });
}
