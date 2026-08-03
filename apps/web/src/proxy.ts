import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Checagem otimista de sessão (lê só o cookie, sem bater no banco) — a fonte
// da verdade de autorização de verdade é o JwtAuthGuard do Nest em cada
// endpoint; isso aqui só evita o flash de tela protegida sem sessão.
const PUBLIC_ROUTES = ["/login"];

async function verifySession(token: string | undefined) {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const token = request.cookies.get("token")?.value;
  const session = await verifySession(token);

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
