"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@flux-finance/ui/components/ui/spinner";
import { useCurrentUser } from "../api/queries";

// A API fica num domínio separado (Railway), então o cookie de sessão não é
// visível para o Next rodando na Vercel — a checagem de rota protegida só
// pode acontecer no client, batendo em /auth/me.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
