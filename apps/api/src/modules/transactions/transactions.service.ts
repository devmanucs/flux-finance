import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountType, Prisma, TransactionKind } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.client.transaction.findMany({
      where: { account: { userId } },
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

  async create(dto: CreateTransactionDto, userId: number) {
    const account = await this.getOwnedAccount(dto.accountId, userId);
    const delta = this.computeBalanceDelta(account.type, dto.kind, dto.amount);

    const [, transaction] = await this.prisma.client.$transaction([
      this.prisma.client.account.update({
        where: { id: account.id },
        data: { balance: { increment: delta } },
      }),
      this.prisma.client.transaction.create({
        data: {
          ...dto,
          date: dto.date ? new Date(dto.date) : undefined,
        },
      }),
    ]);

    return transaction;
  }

  async update(id: number, dto: UpdateTransactionDto, userId: number) {
    const existing = await this.findOne(id, userId);
    const oldAccount = existing.account;

    const newAccount =
      dto.accountId !== undefined && dto.accountId !== oldAccount.id
        ? await this.getOwnedAccount(dto.accountId, userId)
        : oldAccount;

    const reverseDelta = this.computeBalanceDelta(
      oldAccount.type,
      existing.kind,
      existing.amount,
    ).negated();
    const newDelta = this.computeBalanceDelta(
      newAccount.type,
      dto.kind ?? existing.kind,
      dto.amount ?? existing.amount,
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
        },
      }),
    ];

    const results = await this.prisma.client.$transaction(ops);
    return results[results.length - 1];
  }

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id, userId);
    const reverseDelta = this.computeBalanceDelta(
      existing.account.type,
      existing.kind,
      existing.amount,
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
