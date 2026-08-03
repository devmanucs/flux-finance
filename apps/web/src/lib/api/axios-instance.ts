import axios from "axios";
import { toast } from "sonner";
import { getStoredToken } from "@/features/auth/lib/token";

declare module "axios" {
  export interface AxiosRequestConfig {
    // Desliga o toast automático de erro do interceptor: os hooks de
    // use-crud.ts já mostram o próprio toast de sucesso/erro, então eles
    // sempre passam `showToast: false` para não duplicar a mensagem.
    showToast?: boolean;
    operation?: "criar" | "atualizar" | "excluir";
  }
}

export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
});

authApi.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config as { showToast?: boolean } | undefined;
    if (config?.showToast !== false) {
      const message =
        error.response?.data?.message ?? "Ocorreu um erro inesperado.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
    return Promise.reject(error);
  },
);
