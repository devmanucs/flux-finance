"use client";

import { useEffect } from "react";
import { Geist_Mono, Noto_Sans, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@flux-finance/ui/lib/utils";
import { ErrorState } from "@flux-finance/ui/components/ui/status-state";

const ralewayHeading = Raleway({ subsets: ["latin"], variable: "--font-heading" });
const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// global-error renderiza fora do RootLayout/Providers, então o
// next-themes não chega aqui (ver aviso em app/error.js dos docs do Next).
// Reaplica a mesma lógica (localStorage "theme", key usada pelo next-themes)
// antes do paint pra não piscar tema errado justo na tela de erro.
const THEME_SCRIPT = `
try {
  var theme = localStorage.getItem('theme');
  var isDark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
} catch (e) {}
`;

export default function GlobalError({
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
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        notoSans.variable,
        ralewayHeading.variable,
        geistMono.variable,
      )}
    >
      <head>
        <title>Erro inesperado — Flux Finance</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen w-full items-center justify-center px-6 py-16">
          <ErrorState
            className="max-w-md"
            title="A aplicação travou"
            description="Um erro inesperado impediu o carregamento da página. Tente recarregar — se persistir, o problema já foi registrado."
            retryLabel="Recarregar"
            onRetry={unstable_retry}
          />
        </div>
      </body>
    </html>
  );
}
