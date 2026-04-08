import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { ProductEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import { ProductRepository } from './product.repository';

function mapProductRow(row: {
  id: string;
  name: string;
  price: Prisma.Decimal;
  categoryId: string | null;
}): ProductEntity {
  return {
    id: row.id,
    name: row.name,
    price: row.price.toNumber(),
    categoryId: row.categoryId ?? undefined,
  };
}

@Injectable()
export class ProductPrismaRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listProducts(args: ListRepoArgs): Promise<ProductEntity[]> {
    const orderBy = {
      [args.sortField]: args.order,
    } as Prisma.ProductOrderByWithRelationInput;
    const rows = await this.prisma.product.findMany({
      skip: args.skip,
      take: args.take,
      orderBy,
    });
    return rows.map(mapProductRow);
  }

  async getProduct(id: string): Promise<ProductEntity | undefined> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? mapProductRow(row) : undefined;
  }

  async saveProduct(entity: ProductEntity): Promise<void> {
    await this.prisma.product.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        name: entity.name,
        price: new Prisma.Decimal(entity.price),
        categoryId: entity.categoryId ?? null,
      },
      update: {
        name: entity.name,
        price: new Prisma.Decimal(entity.price),
        categoryId: entity.categoryId ?? null,
      },
    });
  }

  async countOrderLinksForProduct(_productId: string): Promise<number> {
    return 0;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
