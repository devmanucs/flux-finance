import type { Account as PrismaAccount } from "@flux-finance/database";
import { useCreate, useDelete, useFetch, useUpdate } from "@/lib/hooks/use-crud";
import type { AccountFormValues } from "../schemas/account-schema";

// A API expõe `dueDate`/`isPaid` computados a partir de `dueDay`/`paidAt`
// (ver accounts.service.ts no backend) em vez das colunas brutas do banco.
export type Account = Omit<PrismaAccount, "paidAt"> & {
  dueDate: string | null;
  isPaid: boolean;
};

const ROUTE = "/accounts";
export const ACCOUNTS_QUERY_KEY = "accounts";

export function useAccounts() {
  return useFetch<Account[]>({
    queryKey: [ACCOUNTS_QUERY_KEY],
    route: ROUTE,
  });
}

export function useCreateAccount() {
  return useCreate<Account, AccountFormValues>({
    route: ROUTE,
    mutationKey: ["criar-conta"],
    queryInvalidationKeys: [ACCOUNTS_QUERY_KEY],
  });
}

export function useUpdateAccount() {
  return useUpdate<Account, Partial<AccountFormValues>>({
    route: ROUTE,
    mutationKey: ["atualizar-conta"],
    queryInvalidationKeys: [ACCOUNTS_QUERY_KEY],
  });
}

export function useDeleteAccount() {
  return useDelete({
    route: ROUTE,
    mutationKey: ["excluir-conta"],
    queryInvalidationKeys: [ACCOUNTS_QUERY_KEY],
  });
}
