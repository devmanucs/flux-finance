import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.client.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: number, userId: number) {
    const account = await this.prisma.client.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Conta ${id} não encontrada`);
    }

    return account;
  }

  create(dto: CreateAccountDto, userId: number) {
    return this.prisma.client.account.create({
      data: { ...dto, userId },
    });
  }

  async update(id: number, dto: UpdateAccountDto, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.client.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    // Cascade no schema remove as transactions dessa conta junto.
    await this.prisma.client.account.delete({ where: { id } });
  }
}
