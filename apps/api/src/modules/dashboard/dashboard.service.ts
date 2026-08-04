import { Injectable } from "@nestjs/common";
import { Prisma } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";

const DEBT_TYPES = ["CREDIT_CARD"];
// Saldo de uso restrito (só compra comida/refeição): fica de fora do saldo
// gastável, com bucket próprio — mas soma no patrimônio líquido.
const MEAL_VOUCHER_TYPES = ["MEAL_VOUCHER"];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const accounts = await this.prisma.client.account.findMany({
      where: { userId },
      select: { type: true, balance: true, isReserved: true },
    });

    let totalBalance = new Prisma.Decimal(0);
    let totalReserved = new Prisma.Decimal(0);
    let totalMealVoucher = new Prisma.Decimal(0);
    let totalDebt = new Prisma.Decimal(0);

    for (const account of accounts) {
      if (DEBT_TYPES.includes(account.type)) {
        totalDebt = totalDebt.add(account.balance);
      } else if (MEAL_VOUCHER_TYPES.includes(account.type)) {
        totalMealVoucher = totalMealVoucher.add(account.balance);
      } else if (account.isReserved) {
        totalReserved = totalReserved.add(account.balance);
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
        isPaid: true,
      },
      _sum: { amount: true },
    });

    const monthIncome = monthGroups.find((g) => g.kind === "INCOME")?._sum.amount ?? new Prisma.Decimal(0);
    const monthExpense = monthGroups.find((g) => g.kind === "EXPENSE")?._sum.amount ?? new Prisma.Decimal(0);

    return {
      totalBalance: totalBalance.toNumber(),
      totalReserved: totalReserved.toNumber(),
      totalMealVoucher: totalMealVoucher.toNumber(),
      totalDebt: totalDebt.toNumber(),
      netWorth: totalBalance.add(totalReserved).add(totalMealVoucher).sub(totalDebt).toNumber(),
      currentMonth: {
        income: new Prisma.Decimal(monthIncome).toNumber(),
        expense: new Prisma.Decimal(monthExpense).toNumber(),
        net: new Prisma.Decimal(monthIncome).sub(monthExpense).toNumber(),
      },
    };
  }

  async cashflow(userId: number, range: string) {
    if (range === "1w") {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const rows = await this.prisma.client.$queryRaw<
        { day: Date; income: Prisma.Decimal; expense: Prisma.Decimal }[]
      >`
        SELECT
          date_trunc('day', t.date) AS day,
          COALESCE(SUM(CASE WHEN t.kind = 'INCOME' THEN t.amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.kind = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS expense
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        WHERE a.user_id = ${userId} AND t.date >= ${since} AND t.is_paid = true
        GROUP BY day
        ORDER BY day ASC
      `;

      return rows.map((row) => ({
        period: row.day.toISOString().slice(0, 10),
        income: new Prisma.Decimal(row.income).toNumber(),
        expense: new Prisma.Decimal(row.expense).toNumber(),
      }));
    }

    const months = Number(range);
    const since = new Date();
    since.setMonth(since.getMonth() - ((Number.isFinite(months) ? months : 6) - 1));
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
      WHERE a.user_id = ${userId} AND t.date >= ${since} AND t.is_paid = true
      GROUP BY month
      ORDER BY month ASC
    `;

    return rows.map((row) => ({
      period: row.month.toISOString().slice(0, 7),
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
        isPaid: true,
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
