import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { prisma } from "@flux-finance/database";

// Wrapper injetável em torno do client singleton de @flux-finance/database,
// só para participar do ciclo de vida (conexão/desconexão) do Nest.
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = prisma;

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
