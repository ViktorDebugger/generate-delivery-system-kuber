import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { OrderEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import type { ListOrdersRepoParams } from './order.repository';
import { OrderRepository } from './order.repository';

function mapOrderRow(
  row: {
    id: string;
    orderNumber: string;
    weight: Prisma.Decimal;
    status: string;
    senderId: string;
    receiverId: string;
    courierId: string | null;
    estimatedArrivalTime: string | null;
  },
  productIds: string[],
): OrderEntity {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    weight: row.weight.toNumber(),
    status: row.status,
    senderId: row.senderId,
    receiverId: row.receiverId,
    courierId: row.courierId ?? undefined,
    estimatedArrivalTime: row.estimatedArrivalTime ?? undefined,
    productIds,
  };
}

@Injectable()
export class OrderPrismaRepository extends OrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listOrders(params: ListOrdersRepoParams): Promise<OrderEntity[]> {
    const where =
      params.status !== undefined && params.status !== ''
        ? {
            status: {
              equals: params.status,
              mode: 'insensitive' as const,
            },
          }
        : {};
    const orderBy = {
      [params.sortField]: params.order,
    } as Prisma.OrderOrderByWithRelationInput;
    const rows = await this.prisma.order.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy,
      include: { orderProducts: true },
    });
    return rows.map((row) =>
      mapOrderRow(
        row,
        row.orderProducts.map((link) => link.productId),
      ),
    );
  }

  async getOrder(id: string): Promise<OrderEntity | undefined> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { orderProducts: true },
    });
    if (!row) {
      return undefined;
    }
    return mapOrderRow(
      row,
      row.orderProducts.map((link) => link.productId),
    );
  }

  async saveOrder(entity: OrderEntity): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: entity.id },
        create: {
          id: entity.id,
          orderNumber: entity.orderNumber,
          weight: new Prisma.Decimal(entity.weight),
          status: entity.status,
          senderId: entity.senderId,
          receiverId: entity.receiverId,
          courierId: entity.courierId ?? null,
          estimatedArrivalTime: entity.estimatedArrivalTime ?? null,
        },
        update: {
          orderNumber: entity.orderNumber,
          weight: new Prisma.Decimal(entity.weight),
          status: entity.status,
          senderId: entity.senderId,
          receiverId: entity.receiverId,
          courierId: entity.courierId ?? null,
          estimatedArrivalTime: entity.estimatedArrivalTime ?? null,
        },
      });
      await tx.orderProduct.deleteMany({ where: { orderId: entity.id } });
      if (entity.productIds.length > 0) {
        await tx.orderProduct.createMany({
          data: entity.productIds.map((productId) => ({
            orderId: entity.id,
            productId,
          })),
        });
      }
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }
}
