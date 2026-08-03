import { toast } from "sonner";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type MutationFunctionContext,
  type UndefinedInitialDataOptions,
} from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";
import { authApi } from "@/lib/api/axios-instance";

interface UseFetchProps<T> {
  route: string;
  config?: AxiosRequestConfig<T> | undefined;
}

interface UseCustomMutationsProps<T, TInput = T> {
  route: string;
  mutationKey: string[];
  queryInvalidationKeys?: string[];
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onMutate?:
    | ((
        variables: {
          formData: TInput;
          id: string;
        },
        context: MutationFunctionContext,
      ) => void | Promise<void>)
    | undefined;
}

/**
 * Hook para buscar dados via GET usando React Query.
 *
 * @example
 * const { data, isLoading, isError, error } = useFetch<Transacao[]>({
 *   queryKey: ['transactions'],
 *   route: '/transactions',
 *   config: { params: { kind: 'EXPENSE' } },
 * });
 */
export const useFetch = <T = unknown>({
  route,
  config,
  queryKey,
  ...rest
}: UseFetchProps<T> &
  UndefinedInitialDataOptions<T, Error, T, readonly unknown[]>) => {
  return useQuery<T>({
    ...rest,
    queryKey,
    queryFn: async () => {
      const response = await authApi.get(route, {
        ...config,
        showToast: false, // O React Query já expõe isError/error pra tela tratar.
      });
      return response.data;
    },
  });
};

/**
 * Hook para criar um recurso via POST.
 *
 * @example
 * const { mutate } = useCreate<Transacao>({
 *   route: '/transactions',
 *   mutationKey: ['criar-transacao'],
 *   queryInvalidationKeys: ['transactions'],
 * });
 * mutate({ formData: { description: 'Mercado', amount: 120, kind: 'EXPENSE' } });
 */
export function useCreate<T, TInput = T>({
  route,
  queryInvalidationKeys,
  onSuccess,
  onError,
  mutationKey,
}: UseCustomMutationsProps<T, TInput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey,
    mutationFn: async ({ formData }: { formData: TInput }) => {
      const response = await authApi.post<T>(route, formData, {
        showToast: false,
        operation: "criar",
      });
      return response.data;
    },
    onSuccess: (data: T) => {
      if (onSuccess) {
        onSuccess(data);
      } else {
        toast.success("Criado com sucesso!");
      }
    },
    onError: (error: Error) => {
      if (onError) {
        onError(error);
      } else {
        toast.error("Ocorreu um erro ao criar!");
      }
    },
    onSettled: () => {
      queryInvalidationKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}

/**
 * Hook para atualizar um recurso via PATCH.
 *
 * @example
 * const { mutate } = useUpdate<Transacao>({
 *   route: '/transactions',
 *   mutationKey: ['atualizar-transacao'],
 *   queryInvalidationKeys: ['transactions'],
 * });
 * mutate({ id: '123', formData: { description: 'Novo nome' } });
 */
export function useUpdate<T, TInput = T>({
  route,
  queryInvalidationKeys,
  mutationKey,
  onSuccess,
  onError,
  onMutate,
}: UseCustomMutationsProps<T, TInput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey,
    mutationFn: async ({ formData, id }: { formData: TInput; id: string }) => {
      const response = await authApi.patch<T>(`${route}/${id}`, formData, {
        showToast: false,
        operation: "atualizar",
      });
      return response.data;
    },
    onSuccess: (data: T) => {
      if (onSuccess) {
        onSuccess(data);
      } else {
        toast.success("Atualizado com sucesso!");
      }
    },
    onError: (error: Error) => {
      if (onError) {
        onError(error);
      } else {
        toast.error("Ocorreu um erro ao atualizar!");
      }
    },
    onMutate(variables, context) {
      if (onMutate) {
        onMutate(variables, context);
      }
    },
    onSettled: () => {
      queryInvalidationKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}

/**
 * Hook para excluir um recurso via DELETE.
 *
 * @example
 * const { mutate } = useDelete({
 *   route: '/transactions',
 *   mutationKey: ['excluir-transacao'],
 *   queryInvalidationKeys: ['transactions'],
 * });
 * mutate({ id: '123' });
 */
export function useDelete<T = unknown>({
  route,
  queryInvalidationKeys,
  mutationKey,
  onSuccess,
  onError,
}: UseCustomMutationsProps<T>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey,
    mutationFn: async ({ id }: { id: string }) => {
      await authApi.delete(`${route}/${id}`, {
        showToast: false,
        operation: "excluir",
      });
    },
    onSuccess: (data: unknown) => {
      if (onSuccess) {
        onSuccess(data as T);
      } else {
        toast.success("Excluído com sucesso!");
      }
    },
    onError: (error: Error) => {
      if (onError) {
        onError(error);
      } else {
        toast.error("Ocorreu um erro ao excluir!");
      }
    },
    onSettled: () => {
      queryInvalidationKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}
