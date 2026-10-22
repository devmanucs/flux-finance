import { timingSafeEqual } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
  Param,
} from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { CreateConnectTokenDto } from "./dto/create-connect-token.dto";
import { PluggyService } from "./pluggy.service";

@Controller("pluggy")
export class PluggyController {
  constructor(private readonly pluggyService: PluggyService) {}

  @Post("connect-token")
  createConnectToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConnectTokenDto,
  ) {
    return this.pluggyService.createConnectToken(user.id, dto.itemId)
      .then((accessToken) => ({ accessToken }));
  }

  @Get("connections")
  listConnections(@CurrentUser() user: AuthenticatedUser) {
    return this.pluggyService.listConnections(user.id);
  }

  @Post("sync")
  syncAll(@CurrentUser() user: AuthenticatedUser) {
    return this.pluggyService.syncAll(user.id);
  }

  @Post("items/:itemId/sync")
  syncItem(
    @Param("itemId") itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pluggyService.syncItem(user.id, itemId);
  }

  @Public()
  @Post("webhook")
  async receiveWebhook(
    @Body() payload: unknown,
    @Query("secret") secret: string | undefined,
  ) {
    const expected = process.env.PLUGGY_WEBHOOK_SECRET;
    if (!expected || !secret || !this.secretsMatch(secret, expected)) {
      throw new UnauthorizedException("Webhook inválido.");
    }

    await this.pluggyService.enqueueWebhook(payload);
    return { accepted: true };
  }

  private secretsMatch(received: string, expected: string) {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);
    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}
