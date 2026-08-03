import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.category.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: number) {
    const category = await this.prisma.client.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Categoria ${id} não encontrada`);
    }

    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.client.category.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.client.category.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.client.category.delete({ where: { id } });
  }
}
