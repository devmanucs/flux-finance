import { Injectable, NotFoundException } from "@nestjs/common";
import type { Account } from "@flux-finance/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { computeDueDate, computeEffectiveIsPaid } from "./lib/billing-cycle";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  // Expõe `dueDate`/`isPaid` computados a partir de `dueDay`/`paidAt`
  // (o ciclo vigente), em vez dos valores brutos armazenados.
  private toResponse(account: Account) {
    const { paidAt, ...rest } = account;
    return {
      ...rest,
      dueDate: computeDueDate(account.dueDay),
      isPaid: computeEffectiveIsPaid(account.dueDay, paidAt),
    };
  }

  private toData<T extends { isPaid?: boolean }>(dto: T) {
    const { isPaid, ...rest } = dto;
    return {
      ...rest,
      ...(isPaid !== undefined ? { paidAt: isPaid ? new Date() : null } : {}),
    } as Omit<T, "isPaid"> & { paidAt?: Date | null };
  }

  private async findOneRaw(id: number, userId: number) {
    const account = await this.prisma.client.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Conta ${id} não encontrada`);
    }

    return account;
  }

  async findAll(userId: number) {
    const accounts = await this.prisma.client.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return accounts.map((account) => this.toResponse(account));
  }

  async findOne(id: number, userId: number) {
    return this.toResponse(await this.findOneRaw(id, userId));
  }

  async create(dto: CreateAccountDto, userId: number) {
    const account = await this.prisma.client.account.create({
      data: { ...this.toData(dto), userId },
    });
    return this.toResponse(account);
  }

  async update(id: number, dto: UpdateAccountDto, userId: number) {
    await this.findOneRaw(id, userId);

    const account = await this.prisma.client.account.update({
      where: { id },
      data: this.toData(dto),
    });
    return this.toResponse(account);
  }

  async remove(id: number, userId: number) {
    await this.findOneRaw(id, userId);
    // Cascade no schema remove as transactions dessa conta junto.
    await this.prisma.client.account.delete({ where: { id } });
  }
}
