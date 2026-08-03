import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@flux-finance/ui/lib/utils";
import { Providers } from "./providers";

const ralewayHeading = Raleway({ subsets: ["latin"], variable: "--font-heading" });

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux Finance",
  description: "Gestão financeira pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
