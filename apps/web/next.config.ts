import type { NextConfig } from "next";

// Em produção o browser fala só com o domínio da Vercel e o Next repassa
// /api/* para a API no Render. Assim o cookie de sessão é first-party:
// Safari/iOS, Firefox e Brave bloqueiam cookie de terceiros, e com a API em
// outro domínio o login caía em loop no celular. Usado junto com
// NEXT_PUBLIC_API_URL="/api". Em dev, sem API_PROXY_URL, o front chama
// http://localhost:4000 direto (mesmo site, cookie funciona).
const apiProxyUrl = process.env.API_PROXY_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@flux-finance/ui"],
  async rewrites() {
    if (!apiProxyUrl) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyUrl}/:path*` }];
  },
};

export default nextConfig;
