import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Marca uma rota como isenta do JwtAuthGuard global (só o /auth/login e
// /auth/logout usam isso — o resto da API exige sessão).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
