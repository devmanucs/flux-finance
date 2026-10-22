"use client";

import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/axios-instance";

const PluggyWidget = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false },
);

export const CONNECTIONS_QUERY_KEY = ["pluggy-connections"] as const;
const DATA_QUERY_KEYS = [
  "accounts",
  "transactions",
  "dashboard-summary",
  "dashboard-cashflow",
  "dashboard-by-category",
];

export type PluggyConnection = {
  id: number;
  itemId: string;
  institutionName: string;
  status: string;
  lastSyncedAt: string | null;
  accountCount: number;
};

function apiErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (!message) return fallback;
  return Array.isArray(message) ? message.join(", ") : message;
}

async function invalidateBankData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    ...DATA_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] })),
    queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY }),
  ]);
}

export function usePluggyConnections(poll = false) {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await authApi.get<PluggyConnection[]>("/pluggy/connections", {
        showToast: false,
      });
      return response.data;
    },
    refetchInterval: poll ? 15_000 : false,
    refetchIntervalInBackground: false,
  });
}

// Puxa da Pluggy o que o banco já atualizou (as atualizações em si acontecem
// na própria Pluggy/MeuPluggy; aqui só buscamos o resultado).
export function useSyncBanks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await authApi.post<PluggyConnection[]>("/pluggy/sync", {}, { showToast: false });
      return response.data;
    },
    onSuccess: async () => {
      await invalidateBankData(queryClient);
      toast.success("Bancos atualizados.");
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
      toast.error(apiErrorMessage(error, "Não foi possível atualizar seus bancos agora."));
    },
  });
}

export function PluggySyncWatcher() {
  const queryClient = useQueryClient();
  const { data: connections } = usePluggyConnections(true);
  const previousSyncs = useRef<string | null>(null);

  useEffect(() => {
    if (!connections) return;

    const signature = connections
      .map((connection) => `${connection.id}:${connection.lastSyncedAt ?? ""}`)
      .sort()
      .join("|");

    if (previousSyncs.current !== null && previousSyncs.current !== signature) {
      for (const queryKey of DATA_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
    }
    previousSyncs.current = signature;
  }, [connections, queryClient]);

  return null;
}

type PluggyConnectContextValue = {
  connect: () => void;
  isBusy: boolean;
};

const PluggyConnectContext = createContext<PluggyConnectContextValue | null>(null);

export function usePluggyConnect() {
  const context = useContext(PluggyConnectContext);
  if (!context) throw new Error("usePluggyConnect precisa estar dentro de <PluggyConnectProvider>.");
  return context;
}

// Dono do widget da Pluggy: qualquer botão da página ("Nova conta",
// "Conectar outro banco") abre a mesma instância via usePluggyConnect().
export function PluggyConnectProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  async function connect() {
    if (accessToken || isStarting || isSyncing) return;
    setIsStarting(true);
    try {
      const response = await authApi.post<{ accessToken: string }>("/pluggy/connect-token", {}, { showToast: false });
      setAccessToken(response.data.accessToken);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível iniciar a conexão com o Pluggy."));
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSuccess(itemId: string) {
    setAccessToken(null);
    setIsSyncing(true);
    const toastId = toast.loading("Trazendo contas e transações do banco...");
    try {
      await authApi.post(`/pluggy/items/${encodeURIComponent(itemId)}/sync`, {}, { showToast: false });
      await invalidateBankData(queryClient);
      toast.success("Banco conectado e dados sincronizados.", { id: toastId });
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
      toast.error(apiErrorMessage(error, "A conexão foi feita, mas não foi possível sincronizar os dados agora."), {
        id: toastId,
      });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <PluggyConnectContext.Provider value={{ connect: () => void connect(), isBusy: Boolean(accessToken) || isStarting || isSyncing }}>
      {children}
      {accessToken ? (
        <PluggyWidget
          connectToken={accessToken}
          includeSandbox={process.env.NEXT_PUBLIC_PLUGGY_INCLUDE_SANDBOX === "true"}
          language="pt-BR"
          onSuccess={({ item }) => handleSuccess(item.id)}
          onError={({ message }) => {
            setAccessToken(null);
            toast.error(message || "Não foi possível conectar o banco.");
          }}
          onLoadError={(error) => {
            setAccessToken(null);
            toast.error(error.message || "Não foi possível abrir a conexão segura do Pluggy.");
          }}
          onClose={() => setAccessToken(null)}
        />
      ) : null}
    </PluggyConnectContext.Provider>
  );
}
