import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AccountType, Prisma, TransactionKind, type PluggyWebhookEvent } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  PluggyApiService,
  type PluggyAccount,
  type PluggyAccountWithCredit,
  type PluggyBill,
  type PluggyCategory,
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

// Código COMPE (3 dígitos do transferNumber "237/2218/...") -> nome do banco.
const BANK_NAMES_BY_CODE: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "077": "Banco Inter",
  "104": "Caixa",
  "197": "Stone",
  "208": "BTG Pactual",
  "212": "Banco Original",
  "237": "Bradesco",
  "260": "Nubank",
  "290": "PagBank",
  "323": "Mercado Pago",
  "336": "C6 Bank",
  "341": "Itaú",
  "380": "PicPay",
  "403": "Cora",
  "422": "Safra",
  "748": "Sicredi",
  "756": "Sicoob",
};

// Gravado em accounts.credit_card; o front deriva aberta/fechada/vencida.
export interface CreditCardSummary {
  limit: number | null;
  available: number | null;
  used: number | null;
  openBill: { amount: number; period: string; closeDate: string | null; dueDate: string | null };
  lastBill: {
    total: number;
    paid: number;
    minimumPayment: number | null;
    closeDate: string | null;
    dueDate: string;
  } | null;
  futureInstallments: number;
}

type CategoryResolver = (pluggyCategoryId: string | null | undefined) => Promise<number | null>;

const INVESTMENT_LABELS: Record<string, string> = {
  CDB: "CDB",
  LCI: "LCI",
  LCA: "LCA",
  LC: "LC",
  CRI: "CRI",
  CRA: "CRA",
  TREASURY: "Tesouro Direto",
  DEBENTURES: "debêntures",
  MUTUAL_FUND: "fundos",
  INVESTMENT_FUND: "fundos",
  STOCK: "ações",
  ETF: "ETFs",
  REAL_ESTATE_FUND: "fundos imobiliários",
};

const CATEGORY_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#3b82f6",
  "#84cc16",
  "#f43f5e",
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function toPeriod(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function addMonthsToPeriod(period: string, months: number) {
  const [year, month] = period.split("-").map(Number);
  return toPeriod(new Date(Date.UTC(year!, month! - 1 + months, 1)));
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function toIsoOrNull(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
        await this.saveTransactions(localAccount, transactions, await this.loadCategoryResolver());
      }
    } else if (event.event === "transactions/created") {
      const createdAtFrom = payload.transactionsCreatedAtFrom ??
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const transactions = await this.pluggyApi.listTransactions(payload.accountId, { createdAtFrom });
      await this.saveTransactions(localAccount, transactions, await this.loadCategoryResolver());
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
      // institutionName é resolvido no syncConnection (nome real do banco).
      update: {
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
    const resolveCategory = includeTransactions ? await this.loadCategoryResolver() : null;

    // Uma conta com erro não derruba as outras do mesmo item.
    let failures = 0;
    for (const remoteAccount of remoteAccounts) {
      try {
        // Cartão sempre busca transações: o resumo da fatura depende delas.
        const isCard = remoteAccount.type?.toUpperCase() === "CREDIT";
        const transactions = includeTransactions || isCard
          ? await this.pluggyApi.listTransactions(remoteAccount.id)
          : [];
        const creditCard = isCard ? await this.buildCreditCardSummary(remoteAccount, transactions) : null;
        const account = await this.saveAccount(connection, remoteAccount, creditCard);
        if (resolveCategory) await this.saveTransactions(account, transactions, resolveCategory);
      } catch (error) {
        failures += 1;
        this.logger.warn(
          `Falha ao sincronizar a conta Pluggy ${remoteAccount.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    if (failures > 0 && failures === remoteAccounts.length) {
      throw new ServiceUnavailableException("Não foi possível sincronizar as contas desta conexão.");
    }

    try {
      await this.syncInvestments(connection, connection.itemId);
    } catch (error) {
      this.logger.warn(
        `Falha ao sincronizar investimentos do item ${connection.itemId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    await this.prisma.client.pluggyConnection.update({
      where: { id: connection.id },
      data: {
        status: failures > 0 ? "PARTIAL" : item.status || "UPDATED",
        institutionName: this.resolveInstitutionName(item, remoteAccounts),
        lastSyncedAt: new Date(),
      },
    });
  }

  async syncAll(userId: number) {
    const connections = await this.prisma.client.pluggyConnection.findMany({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    let failures = 0;
    for (const connection of connections) {
      try {
        await this.syncConnection(connection.id, true);
      } catch (error) {
        failures += 1;
        await this.prisma.client.pluggyConnection.update({
          where: { id: connection.id },
          data: { status: "ERROR" },
        });
        this.logger.warn(
          `Falha ao sincronizar a conexão ${connection.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    if (connections.length > 0 && failures === connections.length) {
      throw new ServiceUnavailableException("Não foi possível atualizar seus bancos agora.");
    }

    return this.listConnections(userId);
  }

  // MeuPluggy agrega vários bancos atrás de um único conector, então o nome
  // do conector não diz qual banco é; o código do banco no número da conta diz.
  private resolveInstitutionName(item: PluggyItem, accounts: PluggyAccount[]) {
    const connectorName = item.connector?.name || "Instituição financeira";
    if (!/meu\s*pluggy/i.test(connectorName)) return connectorName;

    for (const account of accounts) {
      const bankCode = account.bankData?.transferNumber?.split("/")[0];
      const known = bankCode ? BANK_NAMES_BY_CODE[bankCode.padStart(3, "0")] : undefined;
      if (known) return known;
    }

    const bankAccount = accounts.find((account) => account.type?.toUpperCase() === "BANK");
    return bankAccount?.name?.trim() || connectorName;
  }

  private saveAccount(
    connection: { id: number; userId: number },
    remote: PluggyAccount,
    creditCard: CreditCardSummary | null,
  ) {
    const type = this.mapAccountType(remote);
    // No cartão o "balance" da Pluggy varia por banco (o Inter manda 0 mesmo
    // com limite usado); limite menos disponível é o que de fato está devendo.
    const balance = creditCard?.used ?? remote.balance ?? 0;
    const data = {
      name: remote.marketingName || remote.name || "Conta bancária",
      type,
      balance: new Prisma.Decimal(balance),
      currency: remote.currencyCode || "BRL",
      pluggyConnectionId: connection.id,
      ...(creditCard ? { creditCard: creditCard as unknown as Prisma.InputJsonValue } : {}),
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

  // Fatura aberta = lançamentos ainda sem fatura no primeiro período depois
  // da última fechada; períodos seguintes são parcelas futuras. Pagamentos de
  // fatura ficam de fora para não abater duas vezes.
  private async buildCreditCardSummary(
    remote: PluggyAccountWithCredit,
    transactions: PluggyTransaction[],
  ): Promise<CreditCardSummary> {
    const credit = remote.creditData;
    let bills: PluggyBill[] = [];
    try {
      bills = await this.pluggyApi.listCreditCardBills(remote.id);
    } catch (error) {
      this.logger.warn(
        `Faturas indisponíveis para o cartão ${remote.id}: ${error instanceof Error ? error.message : error}`,
      );
    }

    const lastBill = [...bills].sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    )[0];
    const lastClose = lastBill?.billClosingDate ? new Date(lastBill.billClosingDate) : null;
    const lastClosePeriod = lastClose ? toPeriod(lastClose) : null;

    const byPeriod = new Map<string, number>();
    let unscheduled = 0;
    for (const transaction of transactions) {
      if (transaction.creditCardMetadata?.billId) continue;
      if (transaction.amount < 0 && /pagamento/i.test(transaction.description ?? "")) continue;
      const period = transaction.creditCardMetadata?.billForecastDate;
      if (!period) unscheduled += transaction.amount;
      else if (!lastClosePeriod || period > lastClosePeriod) {
        byPeriod.set(period, (byPeriod.get(period) ?? 0) + transaction.amount);
      }
    }

    const periods = [...byPeriod.keys()].sort();
    const openPeriod =
      periods[0] ?? (lastClosePeriod ? addMonthsToPeriod(lastClosePeriod, 1) : toPeriod(new Date()));
    const openAmount = (byPeriod.get(openPeriod) ?? 0) + unscheduled;
    const futureInstallments = periods
      .filter((period) => period > openPeriod)
      .reduce((total, period) => total + (byPeriod.get(period) ?? 0), 0);

    const limit = credit?.creditLimit ?? null;
    const available = credit?.availableCreditLimit ?? null;
    const used = limit !== null && available !== null ? limit - available : (remote.balance ?? null);

    return {
      limit,
      available,
      used: used === null ? null : round2(used),
      openBill: {
        amount: round2(Math.max(openAmount, 0)),
        period: openPeriod,
        closeDate: lastClose ? addMonths(lastClose, 1).toISOString() : toIsoOrNull(credit?.balanceCloseDate),
        dueDate: lastBill
          ? addMonths(new Date(lastBill.dueDate), 1).toISOString()
          : toIsoOrNull(credit?.balanceDueDate),
      },
      lastBill: lastBill
        ? {
            total: round2(lastBill.totalAmount),
            paid: round2((lastBill.payments ?? []).reduce((total, payment) => total + (payment.amount ?? 0), 0)),
            minimumPayment:
              lastBill.minimumPaymentAmount === null || lastBill.minimumPaymentAmount === undefined
                ? null
                : round2(lastBill.minimumPaymentAmount),
            closeDate: toIsoOrNull(lastBill.billClosingDate),
            dueDate: new Date(lastBill.dueDate).toISOString(),
          }
        : null,
      futureInstallments: round2(Math.max(futureInstallments, 0)),
    };
  }

  // Investimentos viram uma conta "guardada" por banco com a soma do que está
  // aplicado (resgates totais ficam de fora).
  private async syncInvestments(connection: { id: number; userId: number }, itemId: string) {
    const investments = (await this.pluggyApi.listInvestments(itemId)).filter(
      (investment) => (investment.balance ?? 0) > 0 && investment.status !== "TOTAL_WITHDRAWAL",
    );
    const pluggyAccountId = `investments:${itemId}`;

    if (investments.length === 0) {
      await this.prisma.client.account.updateMany({
        where: { pluggyAccountId },
        data: { balance: new Prisma.Decimal(0), name: "Nenhuma aplicação ativa" },
      });
      return;
    }

    const kinds = new Set(investments.map((investment) => investment.subtype ?? investment.type));
    const kind = kinds.size === 1 ? INVESTMENT_LABELS[[...kinds][0] ?? ""] : undefined;
    const count = investments.length;
    const name = `${count} ${count === 1 ? "aplicação" : "aplicações"}${kind ? ` em ${kind}` : ""}`;
    const balance = new Prisma.Decimal(
      round2(investments.reduce((total, investment) => total + investment.balance, 0)),
    );

    await this.prisma.client.account.upsert({
      where: { pluggyAccountId },
      create: {
        userId: connection.userId,
        pluggyAccountId,
        pluggyConnectionId: connection.id,
        name,
        type: AccountType.INVESTMENT,
        balance,
        isReserved: true,
      },
      update: { name, balance, pluggyConnectionId: connection.id },
    });
  }

  // Categoriza pela categoria de topo da Pluggy (ex.: "Transferências"), já
  // traduzida; cria a categoria local na primeira vez que ela aparece.
  private async loadCategoryResolver(): Promise<CategoryResolver> {
    let categories: Map<string, PluggyCategory>;
    try {
      categories = await this.pluggyApi.listCategories();
    } catch (error) {
      this.logger.warn(`Categorias da Pluggy indisponíveis: ${error instanceof Error ? error.message : error}`);
      return async () => null;
    }

    const resolved = new Map<string, number | null>();
    return async (pluggyCategoryId) => {
      if (!pluggyCategoryId) return null;
      const topId = `${pluggyCategoryId.slice(0, 2)}000000`;
      if (resolved.has(topId)) return resolved.get(topId) ?? null;

      const top = categories.get(topId) ?? categories.get(pluggyCategoryId);
      const id = top ? await this.ensureCategory(topId, top.descriptionTranslated || top.description) : null;
      resolved.set(topId, id);
      return id;
    };
  }

  private async ensureCategory(pluggyCategoryId: string, name: string) {
    const linked = await this.prisma.client.category.findUnique({ where: { pluggyCategoryId } });
    if (linked) return linked.id;

    // Reaproveita uma categoria que a usuária já criou com o mesmo nome.
    const sameName = await this.prisma.client.category.findFirst({
      where: { pluggyCategoryId: null, name: { equals: name, mode: "insensitive" } },
    });
    if (sameName) {
      await this.prisma.client.category.update({ where: { id: sameName.id }, data: { pluggyCategoryId } });
      return sameName.id;
    }

    try {
      const created = await this.prisma.client.category.create({
        data: {
          name,
          pluggyCategoryId,
          kind: pluggyCategoryId.startsWith("01") ? TransactionKind.INCOME : TransactionKind.EXPENSE,
          color: CATEGORY_COLORS[Number(pluggyCategoryId.slice(0, 2)) % CATEGORY_COLORS.length],
        },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.prisma.client.category.findUnique({ where: { pluggyCategoryId } });
        if (existing) return existing.id;
      }
      throw error;
    }
  }

  // Novas entram num createMany só; existentes só são atualizadas se algo
  // mudou. Evita centenas de upserts paralelos disputando o pool do banco.
  // A categoria só é preenchida se ainda estiver vazia: a que a usuária
  // escolheu na edição nunca é sobrescrita.
  private async saveTransactions(
    account: { id: number; type: AccountType },
    transactions: PluggyTransaction[],
    resolveCategory: CategoryResolver,
  ) {
    for (let offset = 0; offset < transactions.length; offset += 500) {
      const batch = [];
      for (const remote of transactions.slice(offset, offset + 500)) {
        batch.push({
          pluggyTransactionId: remote.id,
          accountId: account.id,
          description: remote.description || "Transação bancária",
          amount: new Prisma.Decimal(Math.abs(remote.amount)),
          kind: this.mapTransactionKind(account.type, remote),
          date: new Date(remote.date),
          isPaid: remote.status?.toUpperCase() !== "PENDING",
          categoryId: await resolveCategory(remote.categoryId),
        });
      }

      const existing = await this.prisma.client.transaction.findMany({
        where: { pluggyTransactionId: { in: batch.map((row) => row.pluggyTransactionId) } },
        select: {
          id: true,
          pluggyTransactionId: true,
          accountId: true,
          description: true,
          amount: true,
          kind: true,
          date: true,
          isPaid: true,
          categoryId: true,
        },
      });
      const existingById = new Map(existing.map((row) => [row.pluggyTransactionId, row]));

      const toCreate = batch.filter((row) => !existingById.has(row.pluggyTransactionId));
      if (toCreate.length > 0) {
        await this.prisma.client.transaction.createMany({ data: toCreate, skipDuplicates: true });
      }

      for (const row of batch) {
        const current = existingById.get(row.pluggyTransactionId);
        if (!current) continue;
        const fillCategory = current.categoryId === null && row.categoryId !== null;
        const changed =
          current.accountId !== row.accountId ||
          current.description !== row.description ||
          !current.amount.equals(row.amount) ||
          current.kind !== row.kind ||
          current.date.getTime() !== row.date.getTime() ||
          current.isPaid !== row.isPaid;
        if (!changed && !fillCategory) continue;

        const { pluggyTransactionId, categoryId, ...data } = row;
        await this.prisma.client.transaction.update({
          where: { pluggyTransactionId },
          data: { ...data, ...(fillCategory ? { categoryId } : {}) },
        });
      }
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
