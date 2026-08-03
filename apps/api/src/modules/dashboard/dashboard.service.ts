import { Injectable } from "@nestjs/common";
import { Prisma } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";

const DEBT_TYPES = ["CREDIT_CARD"];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const accounts = await this.prisma.client.account.findMany({
      where: { userId },
      select: { type: true, balance: true },
    });

    let totalBalance = new Prisma.Decimal(0);
    let totalDebt = new Prisma.Decimal(0);

    for (const account of accounts) {
      if (DEBT_TYPES.includes(account.type)) {
        totalDebt = totalDebt.add(account.balance);
      } else {
        totalBalance = totalBalance.add(account.balance);
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthGroups = await this.prisma.client.transaction.groupBy({
      by: ["kind"],
      where: {
        account: { userId },
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    const monthIncome = monthGroups.find((g) => g.kind === "INCOME")?._sum.amount ?? new Prisma.Decimal(0);
    const monthExpense = monthGroups.find((g) => g.kind === "EXPENSE")?._sum.amount ?? new Prisma.Decimal(0);

    return {
      totalBalance: totalBalance.toNumber(),
      totalDebt: totalDebt.toNumber(),
      netWorth: totalBalance.sub(totalDebt).toNumber(),
      currentMonth: {
        income: new Prisma.Decimal(monthIncome).toNumber(),
        expense: new Prisma.Decimal(monthExpense).toNumber(),
        net: new Prisma.Decimal(monthIncome).sub(monthExpense).toNumber(),
      },
    };
  }

  async cashflow(userId: number, months: number) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await this.prisma.client.$queryRaw<
      { month: Date; income: Prisma.Decimal; expense: Prisma.Decimal }[]
    >`
      SELECT
        date_trunc('month', t.date) AS month,
        COALESCE(SUM(CASE WHEN t.kind = 'INCOME' THEN t.amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN t.kind = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS expense
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = ${userId} AND t.date >= ${since}
      GROUP BY month
      ORDER BY month ASC
    `;

    return rows.map((row) => ({
      month: row.month.toISOString().slice(0, 7),
      income: new Prisma.Decimal(row.income).toNumber(),
      expense: new Prisma.Decimal(row.expense).toNumber(),
    }));
  }

  async byCategory(userId: number, month?: string) {
    const reference = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
    const startOfMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
    const startOfNextMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));

    const groups = await this.prisma.client.transaction.groupBy({
      by: ["categoryId"],
      where: {
        account: { userId },
        kind: "EXPENSE",
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    const categoryIds = groups.map((g) => g.categoryId).filter((id): id is number => id !== null);
    const categories = await this.prisma.client.category.findMany({
      where: { id: { in: categoryIds } },
    });

    return groups
      .map((group) => {
        const category = categories.find((c) => c.id === group.categoryId);
        return {
          categoryId: group.categoryId,
          name: category?.name ?? "Sem categoria",
          color: category?.color ?? null,
          total: new Prisma.Decimal(group._sum.amount ?? 0).toNumber(),
        };
      })
      .sort((a, b) => b.total - a.total);
  }
}
