import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/axios-instance";
import type { LoginFormValues } from "../schemas/login-schema";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

const CURRENT_USER_KEY = "current-user";

// Sessão vive no cookie httpOnly; este hook é a única forma de saber "estou
// logada" no client (o /auth/me falha com 401 se o cookie não existir/expirou).
export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: [CURRENT_USER_KEY],
    queryFn: async () => {
      try {
        const { data } = await authApi.get<CurrentUser>("/auth/me", {
          showToast: false,
        });
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { data } = await authApi.post<{ user: CurrentUser }>(
        "/auth/login",
        values,
        { showToast: false },
      );
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData([CURRENT_USER_KEY], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authApi.post("/auth/logout", null, { showToast: false });
    },
    onSuccess: () => {
      queryClient.setQueryData([CURRENT_USER_KEY], null);
      queryClient.clear();
    },
  });
}
