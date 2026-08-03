import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.transaction.findMany({
      orderBy: { date: "desc" },
    });
  }

  async findOne(id: number) {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transação ${id} não encontrada`);
    }

    return transaction;
  }

  create(dto: CreateTransactionDto) {
    return this.prisma.client.transaction.create({
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async update(id: number, dto: UpdateTransactionDto) {
    await this.findOne(id);

    return this.prisma.client.transaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.client.transaction.delete({ where: { id } });
  }
}
