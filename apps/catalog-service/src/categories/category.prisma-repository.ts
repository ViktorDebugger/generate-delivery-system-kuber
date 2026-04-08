import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { CategoryEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryRepository } from './category.repository';

function mapCategoryRow(row: {
  id: string;
  name: string;
  description: string | null;
}): CategoryEntity {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
  };
}

@Injectable()
export class CategoryPrismaRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listCategories(args: ListRepoArgs): Promise<CategoryEntity[]> {
    const orderBy = {
      [args.sortField]: args.order,
    } as Prisma.CategoryOrderByWithRelationInput;
    const rows = await this.prisma.category.findMany({
      skip: args.skip,
      take: args.take,
      orderBy,
    });
    return rows.map(mapCategoryRow);
  }

  async getCategory(id: string): Promise<CategoryEntity | undefined> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? mapCategoryRow(row) : undefined;
  }

  async saveCategory(entity: CategoryEntity): Promise<void> {
    await this.prisma.category.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        name: entity.name,
        description: entity.description ?? null,
      },
      update: {
        name: entity.name,
        description: entity.description ?? null,
      },
    });
  }

  async countProductsInCategory(categoryId: string): Promise<number> {
    return this.prisma.product.count({
      where: { categoryId },
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
