import type { Account } from "@flux-finance/database";
import { useCreate, useDelete, useFetch, useUpdate } from "@/lib/hooks/use-crud";
import type { AccountFormValues } from "../schemas/account-schema";

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
