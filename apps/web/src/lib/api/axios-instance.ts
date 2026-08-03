import axios from "axios";
import { toast } from "sonner";

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
  // A sessão vive num cookie httpOnly setado pelo Nest — o axios precisa
  // mandar/receber cookies em requests cross-origin (portas diferentes em
  // dev).
  withCredentials: true,
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config as { showToast?: boolean } | undefined;

    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (config?.showToast !== false) {
      const message =
        error.response?.data?.message ?? "Ocorreu um erro inesperado.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
    return Promise.reject(error);
  },
);
