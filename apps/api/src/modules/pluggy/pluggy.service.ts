import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { AccountType, Prisma, TransactionKind, type PluggyWebhookEvent } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  PluggyApiService,
  type PluggyAccount,
  type PluggyItem,
  type PluggyTransaction,
} from "./pluggy-api.service";

interface PluggyWebhookPayload {
  event: string;
  eventId: string;
  itemId?: string;
  accountId?: string;
  transactionIds?: string[];
  transactionsCreatedAtFrom?: string;
  clientUserId?: string | null;
}

interface ClaimedWebhookEvent extends Pick<PluggyWebhookEvent, "id" | "event" | "payload" | "attempts"> {}

@Injectable()
export class PluggyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PluggyService.name);
  private queueTimer: NodeJS.Timeout | undefined;
  private processingQueue = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pluggyApi: PluggyApiService,
  ) {}

  async onModuleInit() {
    const staleProcessingTime = new Date(Date.now() - 10 * 60 * 1000);
    await this.prisma.client.pluggyWebhookEvent.updateMany({
      where: { status: "PROCESSING", processingStartedAt: { lt: staleProcessingTime } },
      data: { status: "FAILED", processingStartedAt: null, nextAttemptAt: new Date() },
    });

    this.queueTimer = setInterval(() => void this.processWebhookQueue(), 5_000);
    this.queueTimer.unref();
    void this.processWebhookQueue();
  }

  onModuleDestroy() {
    if (this.queueTimer) clearInterval(this.queueTimer);
  }

  async createConnectToken(userId: number, itemId?: string) {
    if (itemId) {
      const connection = await this.prisma.client.pluggyConnection.findUnique({
        where: { itemId },
        select: { userId: true },
      });
      if (!connection) throw new NotFoundException("Conexão bancária não encontrada.");
      if (connection.userId !== userId) throw new ForbiddenException("Esta conexão não pertence a você.");
    }

    return this.pluggyApi.createConnectToken(
      {
        clientUserId: String(userId),
        avoidDuplicates: true,
        ...(this.getWebhookUrl() ? { webhookUrl: this.getWebhookUrl() } : {}),
      },
      itemId,
    );
  }

  listConnections(userId: number) {
    return this.prisma.client.pluggyConnection.findMany({
      where: { userId },
      select: {
        id: true,
        itemId: true,
        institutionName: true,
        status: true,
        lastSyncedAt: true,
        _count: { select: { accounts: true } },
      },
      orderBy: { createdAt: "desc" },
    }).then((connections) => connections.map(({ _count, ...connection }) => ({
      ...connection,
      accountCount: _count.accounts,
    })));
  }

  async syncItem(userId: number, itemId: string) {
    let connection = await this.prisma.client.pluggyConnection.findUnique({ where: { itemId } });

    if (connection && connection.userId !== userId) {
      throw new ForbiddenException("Esta conexão não pertence a você.");
    }

    const item = await this.pluggyApi.getItem(itemId);
    this.assertItemOwnership(item, userId);

    connection = await this.saveConnection(item, userId);
    try {
      await this.syncConnection(connection.id, true);
    } catch (error) {
      await this.prisma.client.pluggyConnection.update({
        where: { id: connection.id },
        data: { status: "ERROR" },
      });
      throw error;
    }

    const result = await this.prisma.client.pluggyConnection.findUnique({
      where: { id: connection.id },
      select: {
        id: true,
        itemId: true,
        institutionName: true,
        status: true,
        lastSyncedAt: true,
        _count: { select: { accounts: true } },
      },
    });
    if (!result) return null;
    const { _count, ...savedConnection } = result;
    return { ...savedConnection, accountCount: _count.accounts };
  }

  async enqueueWebhook(payload: unknown) {
    const parsed = this.parseWebhookPayload(payload);

    try {
      await this.prisma.client.pluggyWebhookEvent.create({
        data: {
          eventId: parsed.eventId,
          event: parsed.event,
          payload: parsed as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
      throw error;
    }

    void this.processWebhookQueue();
  }

  private getWebhookUrl() {
    const publicApiUrl = process.env.API_PUBLIC_URL;
    const secret = process.env.PLUGGY_WEBHOOK_SECRET;

    if (!publicApiUrl && !secret) return undefined;
    if (!publicApiUrl || !secret) {
      throw new BadRequestException("Configure API_PUBLIC_URL e PLUGGY_WEBHOOK_SECRET juntos para ativar webhooks.");
    }

    const webhookUrl = new URL("/pluggy/webhook", publicApiUrl);
    if (webhookUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
      throw new BadRequestException("API_PUBLIC_URL precisa usar HTTPS em produção.");
    }
    webhookUrl.searchParams.set("secret", secret);
    return webhookUrl.toString();
  }

  private parseWebhookPayload(value: unknown): PluggyWebhookPayload {
    if (!value || typeof value !== "object") throw new BadRequestException("Payload de webhook inválido.");
    const body = value as Record<string, unknown>;
    if (typeof body.event !== "string" || typeof body.eventId !== "string") {
      throw new BadRequestException("O webhook precisa conter event e eventId.");
    }

    const payload: PluggyWebhookPayload = {
      event: body.event,
      eventId: body.eventId,
    };
    if (typeof body.itemId === "string") payload.itemId = body.itemId;
    if (typeof body.accountId === "string") payload.accountId = body.accountId;
    if (Array.isArray(body.transactionIds)) {
      payload.transactionIds = body.transactionIds.filter((id): id is string => typeof id === "string");
    }
    if (typeof body.transactionsCreatedAtFrom === "string") {
      payload.transactionsCreatedAtFrom = body.transactionsCreatedAtFrom;
    }
    if (typeof body.clientUserId === "string") payload.clientUserId = body.clientUserId;
    return payload;
  }

  private async processWebhookQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      while (true) {
        const [event] = await this.prisma.client.$queryRaw<ClaimedWebhookEvent[]>`
          UPDATE pluggy_webhook_events
          SET status = 'PROCESSING',
              processing_started_at = NOW(),
              attempts = attempts + 1
          WHERE id = (
            SELECT id
            FROM pluggy_webhook_events
            WHERE status IN ('QUEUED', 'FAILED')
              AND attempts < 8
              AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
            ORDER BY received_at
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING id, event, payload, attempts
        `;
        if (!event) break;

        try {
          await this.processWebhookEvent(event);
          await this.prisma.client.pluggyWebhookEvent.update({
            where: { id: event.id },
            data: { status: "PROCESSED", processedAt: new Date(), processingStartedAt: null },
          });
        } catch (error) {
          const delayMinutes = Math.min(60, 2 ** Math.min(event.attempts - 1, 6));
          const message = error instanceof Error ? error.message : "Falha ao processar webhook.";
          this.logger.warn(`Webhook Pluggy ${event.event} falhou; nova tentativa em ${delayMinutes} min.`);
          await this.prisma.client.pluggyWebhookEvent.update({
            where: { id: event.id },
            data: {
              status: "FAILED",
              processingStartedAt: null,
              nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
              lastError: message.slice(0, 1000),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error("Não foi possível processar a fila de webhooks do Pluggy.", error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processWebhookEvent(event: ClaimedWebhookEvent) {
    const payload = event.payload as unknown as PluggyWebhookPayload;
    const itemId = payload.itemId;

    if (event.event === "item/created" && itemId) {
      let connection = await this.prisma.client.pluggyConnection.findUnique({ where: { itemId } });
      if (!connection && payload.clientUserId) {
        const userId = Number(payload.clientUserId);
        if (Number.isInteger(userId) && userId > 0) {
          const user = await this.prisma.client.user.findUnique({ where: { id: userId }, select: { id: true } });
          if (user) {
            const item = await this.pluggyApi.getItem(itemId);
            this.assertItemOwnership(item, user.id);
            connection = await this.saveConnection(item, user.id);
            await this.syncConnection(connection.id, true);
          }
        }
      }
      return;
    }

    if (event.event === "item/deleted" && itemId) {
      await this.archiveConnection(itemId);
      return;
    }

    if (itemId && event.event.startsWith("item/")) {
      const connection = await this.prisma.client.pluggyConnection.findUnique({ where: { itemId } });
      if (!connection) return;

      if (event.event === "item/updated") {
        await this.syncConnection(connection.id, false);
      } else {
        await this.prisma.client.pluggyConnection.update({
          where: { id: connection.id },
          data: { status: event.event.slice("item/".length).toUpperCase() },
        });
      }
      return;
    }

    if (!itemId || !event.event.startsWith("transactions/")) return;
    const connection = await this.prisma.client.pluggyConnection.findUnique({ where: { itemId } });
    if (!connection) return;

    if (event.event === "transactions/deleted") {
      if (payload.accountId && payload.transactionIds?.length) {
        const localAccount = await this.prisma.client.account.findFirst({
          where: { pluggyAccountId: payload.accountId, pluggyConnectionId: connection.id },
          select: { id: true },
        });
        if (localAccount) {
          await this.prisma.client.transaction.deleteMany({
            where: {
              accountId: localAccount.id,
              pluggyTransactionId: { in: payload.transactionIds },
            },
          });
        }
      }
      return;
    }

    if (!payload.accountId) return;
    let localAccount = await this.prisma.client.account.findFirst({
      where: { pluggyAccountId: payload.accountId, pluggyConnectionId: connection.id },
    });
    if (!localAccount) {
      await this.syncConnection(connection.id, false);
      localAccount = await this.prisma.client.account.findFirst({
        where: { pluggyAccountId: payload.accountId, pluggyConnectionId: connection.id },
      });
    }
    if (!localAccount) return;

    if (event.event === "transactions/updated" && payload.transactionIds?.length) {
      for (let offset = 0; offset < payload.transactionIds.length; offset += 500) {
        const transactionIds = payload.transactionIds.slice(offset, offset + 500);
        const transactions = await this.pluggyApi.listTransactions(payload.accountId, { ids: transactionIds });
        await this.saveTransactions(localAccount, transactions);
      }
    } else if (event.event === "transactions/created") {
      const createdAtFrom = payload.transactionsCreatedAtFrom ??
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const transactions = await this.pluggyApi.listTransactions(payload.accountId, { createdAtFrom });
      await this.saveTransactions(localAccount, transactions);
    }
  }

  private async saveConnection(item: PluggyItem, userId: number) {
    const existing = await this.prisma.client.pluggyConnection.findUnique({ where: { itemId: item.id } });
    if (existing && existing.userId !== userId) {
      throw new ForbiddenException("Esta conexão já pertence a outro usuário.");
    }

    return this.prisma.client.pluggyConnection.upsert({
      where: { itemId: item.id },
      create: {
        userId,
        itemId: item.id,
        institutionName: item.connector?.name || "Instituição financeira",
        status: item.status || "UPDATED",
      },
      update: {
        institutionName: item.connector?.name || "Instituição financeira",
        status: item.status || "UPDATED",
      },
    });
  }

  private assertItemOwnership(item: PluggyItem, userId: number) {
    if (!item.clientUserId || item.clientUserId !== String(userId)) {
      throw new ForbiddenException("Não foi possível validar a titularidade desta conexão.");
    }
  }

  private async syncConnection(connectionId: number, includeTransactions: boolean) {
    const connection = await this.prisma.client.pluggyConnection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException("Conexão bancária não encontrada.");

    await this.prisma.client.pluggyConnection.update({
      where: { id: connection.id },
      data: { status: "SYNCING" },
    });

    const item = await this.pluggyApi.getItem(connection.itemId);
    this.assertItemOwnership(item, connection.userId);
    const remoteAccounts = await this.pluggyApi.listAccounts(connection.itemId);

    for (const remoteAccount of remoteAccounts) {
      const account = await this.saveAccount(connection, remoteAccount);
      if (!includeTransactions) continue;

      const transactions = await this.pluggyApi.listTransactions(remoteAccount.id);
      await this.saveTransactions(account, transactions);
    }

    await this.prisma.client.pluggyConnection.update({
      where: { id: connection.id },
      data: { status: item.status || "UPDATED", lastSyncedAt: new Date() },
    });
  }

  private saveAccount(connection: { id: number; userId: number }, remote: PluggyAccount) {
    const type = this.mapAccountType(remote);
    const data = {
      name: remote.marketingName || remote.name || "Conta bancária",
      type,
      balance: new Prisma.Decimal(remote.balance ?? 0),
      currency: remote.currencyCode || "BRL",
      pluggyConnectionId: connection.id,
    };

    return this.prisma.client.account.upsert({
      where: { pluggyAccountId: remote.id },
      create: {
        ...data,
        userId: connection.userId,
        pluggyAccountId: remote.id,
      },
      update: data,
    });
  }

  private async saveTransactions(
    account: { id: number; type: AccountType },
    transactions: PluggyTransaction[],
  ) {
    for (let offset = 0; offset < transactions.length; offset += 25) {
      const batch = transactions.slice(offset, offset + 25);
      await Promise.all(batch.map((remote) => {
        const amount = Math.abs(remote.amount);
        const kind = this.mapTransactionKind(account.type, remote);

        return this.prisma.client.transaction.upsert({
          where: { pluggyTransactionId: remote.id },
          create: {
            accountId: account.id,
            description: remote.description || "Transação bancária",
            amount: new Prisma.Decimal(amount),
            kind,
            date: new Date(remote.date),
            isPaid: remote.status?.toUpperCase() !== "PENDING",
            pluggyTransactionId: remote.id,
          },
          update: {
            accountId: account.id,
            description: remote.description || "Transação bancária",
            amount: new Prisma.Decimal(amount),
            kind,
            date: new Date(remote.date),
            isPaid: remote.status?.toUpperCase() !== "PENDING",
          },
        });
      }));
    }
  }

  private mapAccountType(account: PluggyAccount): AccountType {
    const subtype = `${account.subtype ?? ""} ${account.name ?? ""}`.toUpperCase();
    if (account.type?.toUpperCase() === "CREDIT") return AccountType.CREDIT_CARD;
    if (account.type?.toUpperCase() === "INVESTMENT") return AccountType.INVESTMENT;
    if (subtype.includes("MEAL") || subtype.includes("VOUCHER")) return AccountType.MEAL_VOUCHER;
    if (subtype.includes("SAVINGS") || subtype.includes("POUPAN")) return AccountType.SAVINGS;
    if (account.type?.toUpperCase() === "CASH") return AccountType.CASH;
    return AccountType.CHECKING;
  }

  private mapTransactionKind(accountType: AccountType, transaction: PluggyTransaction): TransactionKind {
    if (accountType === AccountType.CREDIT_CARD) {
      return transaction.amount >= 0 ? TransactionKind.EXPENSE : TransactionKind.INCOME;
    }

    const type = transaction.type?.toUpperCase();
    if (type === "CREDIT") return TransactionKind.INCOME;
    if (type === "DEBIT") return TransactionKind.EXPENSE;
    return transaction.amount >= 0 ? TransactionKind.INCOME : TransactionKind.EXPENSE;
  }

  private async archiveConnection(itemId: string) {
    const connection = await this.prisma.client.pluggyConnection.findUnique({ where: { itemId } });
    if (!connection) return;

    await this.prisma.client.$transaction([
      this.prisma.client.transaction.updateMany({
        where: { account: { pluggyConnectionId: connection.id } },
        data: { pluggyTransactionId: null },
      }),
      this.prisma.client.account.updateMany({
        where: { pluggyConnectionId: connection.id },
        data: { pluggyAccountId: null, pluggyConnectionId: null },
      }),
      this.prisma.client.pluggyConnection.delete({ where: { id: connection.id } }),
    ]);
  }
}
