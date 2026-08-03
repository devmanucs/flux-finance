"use client";

import { useEffect } from "react";
import { ErrorState } from "@flux-finance/ui/components/ui/status-state";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16">
      <ErrorState
        className="max-w-md"
        title="Algo quebrou por aqui"
        description="Ocorreu um erro inesperado ao carregar essa página. Tente novamente — se persistir, o problema já foi registrado."
        onRetry={unstable_retry}
      />
    </div>
  );
}
