import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryReportRepository } from './delivery-report.repository';
import type {
  DeliveriesReportResponse,
  DeliveryReportFilter,
} from './delivery-report.types';

@Injectable()
export class DeliveryReportPrismaRepository extends DeliveryReportRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private where(filter: DeliveryReportFilter): Prisma.OrderWhereInput {
    const w: Prisma.OrderWhereInput = {
      createdAt: {
        gte: filter.dateFrom,
        lte: filter.dateTo,
      },
    };
    if (filter.courierId !== undefined && filter.courierId !== '') {
      w.courierId = filter.courierId;
    }
    if (filter.status !== undefined && filter.status !== '') {
      w.status = filter.status;
    }
    return w;
  }

  async getDeliveriesReport(
    filter: DeliveryReportFilter,
  ): Promise<DeliveriesReportResponse> {
    const where = this.where(filter);

    const [totalOrders, byStatusRows, byCourierRows, agg] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.order.groupBy({
        by: ['courierId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where,
        _sum: { weight: true },
        _avg: { weight: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = row._count._all;
    }

    const byCourier = [...byCourierRows]
      .sort((a, b) => {
        const aKey = a.courierId ?? '';
        const bKey = b.courierId ?? '';
        return aKey.localeCompare(bKey);
      })
      .map((row) => ({
        courierId: row.courierId,
        name: null,
        orderCount: row._count._all,
      }));

    return {
      totalOrders,
      byStatus,
      byCourier,
      weight: {
        sum: agg._sum.weight?.toNumber() ?? 0,
        average: agg._avg.weight?.toNumber() ?? 0,
      },
    };
  }
}
