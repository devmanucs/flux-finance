import type { Category } from "@flux-finance/database";
import { useCreate, useDelete, useFetch, useUpdate } from "@/lib/hooks/use-crud";
import type { CategoryFormValues } from "../schemas/category-schema";

const ROUTE = "/categories";
export const CATEGORIES_QUERY_KEY = "categories";

export function useCategories() {
  return useFetch<Category[]>({
    queryKey: [CATEGORIES_QUERY_KEY],
    route: ROUTE,
  });
}

export function useCreateCategory() {
  return useCreate<Category, CategoryFormValues>({
    route: ROUTE,
    mutationKey: ["criar-categoria"],
    queryInvalidationKeys: [CATEGORIES_QUERY_KEY],
  });
}

export function useUpdateCategory() {
  return useUpdate<Category, Partial<CategoryFormValues>>({
    route: ROUTE,
    mutationKey: ["atualizar-categoria"],
    queryInvalidationKeys: [CATEGORIES_QUERY_KEY],
  });
}

export function useDeleteCategory() {
  return useDelete({
    route: ROUTE,
    mutationKey: ["excluir-categoria"],
    queryInvalidationKeys: [CATEGORIES_QUERY_KEY],
  });
}
