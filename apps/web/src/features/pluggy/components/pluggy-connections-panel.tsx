"use client";

import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import { authApi } from "@/lib/api/axios-instance";

const PluggyWidget = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false, loading: () => <p className="text-xs text-muted-foreground">Abrindo conexão segura...</p> },
);

const CONNECTIONS_QUERY_KEY = ["pluggy-connections"] as const;
const DATA_QUERY_KEYS = [
  "accounts",
  "transactions",
  "dashboard-summary",
  "dashboard-cashflow",
  "dashboard-by-category",
];

type PluggyConnection = {
  id: number;
  itemId: string;
  institutionName: string;
  status: string;
  lastSyncedAt: string | null;
  accountCount: number;
};

type PluggyWidgetSession = {
  accessToken: string;
  itemId?: string;
};

function usePluggyConnections(poll = false) {
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

function statusLabel(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "UPDATED") return "Atualizada";
  if (normalized === "SYNCING" || normalized === "UPDATING") return "Sincronizando";
  if (normalized.includes("WAITING_USER")) return "Precisa da sua atenção";
  if (normalized.includes("ERROR") || normalized.includes("LOGIN")) return "Verifique a conexão";
  if (normalized === "DELETED") return "Desconectada";
  return normalized.replaceAll("_", " ").toLowerCase();
}

function formatSyncDate(value: string | null) {
  if (!value) return "Aguardando primeira sincronização";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sincronização recebida";
  return `Atualizada em ${date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`;
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

export function PluggyConnectionsPanel() {
  const queryClient = useQueryClient();
  const { data: connections = [], isPending, isError, refetch } = usePluggyConnections();
  const [widget, setWidget] = useState<PluggyWidgetSession | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  async function startWidget(itemId?: string) {
    try {
      const response = await authApi.post<{ accessToken: string }>(
        "/pluggy/connect-token",
        itemId ? { itemId } : {},
        { showToast: false },
      );
      setWidget({ accessToken: response.data.accessToken, itemId });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message ??
        "Não foi possível iniciar a conexão com o Pluggy.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  }

  async function handleSuccess(itemId: string) {
    setWidget(null);
    setBusyItemId(itemId);
    try {
      await authApi.post(`/pluggy/items/${encodeURIComponent(itemId)}/sync`, {}, { showToast: false });
      toast.success("Banco conectado e dados sincronizados.");
      for (const queryKey of DATA_QUERY_KEYS) {
        await queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message ??
        "A conexão foi feita, mas não foi possível sincronizar os dados agora.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">Conexões bancárias</CardTitle>
          <CardDescription>
            Conecte pelo Open Finance. O Flux Finance atualiza as informações quando a Pluggy recebe dados novos do banco.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => void startWidget()} disabled={Boolean(widget) || Boolean(busyItemId)}>
          Conectar banco
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {widget ? (
          <PluggyWidget
            connectToken={widget.accessToken}
            updateItem={widget.itemId}
            includeSandbox={process.env.NEXT_PUBLIC_PLUGGY_INCLUDE_SANDBOX === "true"}
            language="pt-BR"
            onSuccess={({ item }) => handleSuccess(item.id)}
            onError={({ message }) => {
              setWidget(null);
              toast.error(message || "Não foi possível conectar o banco.");
            }}
            onLoadError={(error) => {
              setWidget(null);
              toast.error(error.message || "Não foi possível abrir a conexão segura do Pluggy.");
            }}
            onClose={() => setWidget(null)}
          />
        ) : null}

        {isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Não foi possível carregar suas conexões.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum banco conectado ainda. A conexão não altera os lançamentos manuais que você já cadastrou.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {connections.map((connection) => (
              <li key={connection.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{connection.institutionName}</p>
                  <p className="text-xs text-muted-foreground">
                    {statusLabel(connection.status)} · {connection.accountCount} {connection.accountCount === 1 ? "conta" : "contas"} · {formatSyncDate(connection.lastSyncedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(widget) || busyItemId === connection.itemId}
                  onClick={() => void startWidget(connection.itemId)}
                >
                  {busyItemId === connection.itemId ? "Sincronizando..." : "Atualizar conexão"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
