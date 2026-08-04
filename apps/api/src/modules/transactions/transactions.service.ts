import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountType, Prisma, TransactionKind } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRecurringTransactionDto } from "./dto/create-recurring-transaction.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { addMonths } from "./lib/recurrence";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number, month?: string) {
    let dateFilter: Prisma.DateTimeFilter | undefined;

    if (month) {
      const reference = new Date(`${month}-01T00:00:00Z`);
      const startOfMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
      const startOfNextMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));
      dateFilter = { gte: startOfMonth, lt: startOfNextMonth };
    }

    return this.prisma.client.transaction.findMany({
      where: { account: { userId }, ...(dateFilter ? { date: dateFilter } : {}) },
      include: { category: true },
      orderBy: { date: "desc" },
    });
  }

  async findOne(id: number, userId: number) {
    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id, account: { userId } },
      include: { account: true, category: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transação ${id} não encontrada`);
    }

    return transaction;
  }

  private async getOwnedAccount(accountId: number, userId: number) {
    const account = await this.prisma.client.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ForbiddenException("Conta não encontrada para este usuário");
    }

    return account;
  }

  /**
   * Contas normais: INCOME soma, EXPENSE subtrai do saldo.
   * CREDIT_CARD guarda "quanto você deve", então o efeito é invertido:
   * EXPENSE aumenta a dívida, INCOME (pagamento/estorno) diminui.
   */
  private computeBalanceDelta(
    accountType: AccountType,
    kind: TransactionKind,
    amount: Prisma.Decimal | number,
  ): Prisma.Decimal {
    const decimalAmount = new Prisma.Decimal(amount);
    const base = kind === "INCOME" ? decimalAmount : decimalAmount.negated();
    return accountType === "CREDIT_CARD" ? base.negated() : base;
  }

  // Uma transação só mexe no saldo da conta se estiver marcada como paga —
  // uma pendência (aluguel ainda não pago, por exemplo) fica só registrada,
  // sem afetar o saldo, até você marcar como paga.
  private appliedDelta(
    accountType: AccountType,
    kind: TransactionKind,
    amount: Prisma.Decimal | number,
    isPaid: boolean,
  ): Prisma.Decimal {
    return isPaid ? this.computeBalanceDelta(accountType, kind, amount) : new Prisma.Decimal(0);
  }

  async create(dto: CreateTransactionDto, userId: number) {
    const account = await this.getOwnedAccount(dto.accountId, userId);
    const delta = this.appliedDelta(account.type, dto.kind, dto.amount, dto.isPaid ?? false);

    const [, transaction] = await this.prisma.client.$transaction([
      this.prisma.client.account.update({
        where: { id: account.id },
        data: { balance: { increment: delta } },
      }),
      this.prisma.client.transaction.create({
        data: {
          ...dto,
          date: dto.date ? new Date(dto.date) : undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        },
      }),
    ]);

    return transaction;
  }

  // Gera N lançamentos de uma vez (aluguel, água...), um por ciclo, em vez
  // de exigir relançar manualmente todo mês. Cada ocorrência nasce como uma
  // transação independente e comum — editável/exclu­ível isoladamente.
  async createRecurring(dto: CreateRecurringTransactionDto, userId: number) {
    const { repeatEveryMonths, occurrences, ...base } = dto;
    const account = await this.getOwnedAccount(base.accountId, userId);
    const baseDate = base.date ? new Date(base.date) : new Date();
    const baseDueDate = base.dueDate ? new Date(base.dueDate) : null;
    const isPaid = base.isPaid ?? false;
    const delta = this.appliedDelta(account.type, base.kind, base.amount, isPaid);

    const ops = [];
    for (let i = 0; i < occurrences; i++) {
      const offset = i * repeatEveryMonths;
      ops.push(
        this.prisma.client.account.update({
          where: { id: account.id },
          data: { balance: { increment: delta } },
        }),
        this.prisma.client.transaction.create({
          data: {
            accountId: base.accountId,
            categoryId: base.categoryId,
            description: base.description,
            amount: base.amount,
            kind: base.kind,
            date: addMonths(baseDate, offset),
            dueDate: baseDueDate ? addMonths(baseDueDate, offset) : null,
            isPaid,
          },
        }),
      );
    }

    const results = await this.prisma.client.$transaction(ops);
    return results.filter((_, index) => index % 2 === 1);
  }

  async update(id: number, dto: UpdateTransactionDto, userId: number) {
    const existing = await this.findOne(id, userId);
    const oldAccount = existing.account;

    const newAccount =
      dto.accountId !== undefined && dto.accountId !== oldAccount.id
        ? await this.getOwnedAccount(dto.accountId, userId)
        : oldAccount;

    const reverseDelta = this.appliedDelta(
      oldAccount.type,
      existing.kind,
      existing.amount,
      existing.isPaid,
    ).negated();
    const newDelta = this.appliedDelta(
      newAccount.type,
      dto.kind ?? existing.kind,
      dto.amount ?? existing.amount,
      dto.isPaid ?? existing.isPaid,
    );

    const ops = [
      this.prisma.client.account.update({
        where: { id: oldAccount.id },
        data: { balance: { increment: reverseDelta } },
      }),
      this.prisma.client.account.update({
        where: { id: newAccount.id },
        data: { balance: { increment: newDelta } },
      }),
      this.prisma.client.transaction.update({
        where: { id },
        data: {
          ...dto,
          date: dto.date ? new Date(dto.date) : undefined,
          dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        },
      }),
    ];

    const results = await this.prisma.client.$transaction(ops);
    return results[results.length - 1];
  }

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id, userId);
    const reverseDelta = this.appliedDelta(
      existing.account.type,
      existing.kind,
      existing.amount,
      existing.isPaid,
    ).negated();

    await this.prisma.client.$transaction([
      this.prisma.client.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: reverseDelta } },
      }),
      this.prisma.client.transaction.delete({ where: { id } }),
    ]);
  }
}
