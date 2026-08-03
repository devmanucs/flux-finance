import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, user } = await this.authService.login(dto.email, dto.password);
    const isProduction = this.configService.get("NODE_ENV") === "production";

    response.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      // Em produção, web (Vercel) e api (Railway) ficam em domínios
      // diferentes, então o cookie é cross-site: precisa de sameSite=none
      // + secure para o browser aceitar mandá-lo de volta na API.
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: COOKIE_MAX_AGE_MS,
      path: "/",
    });

    return { user };
  }

  @Public()
  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true };
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.findCurrentUser(user.id);
  }
}
