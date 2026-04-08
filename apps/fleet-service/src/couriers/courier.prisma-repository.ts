import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { CourierEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import { CourierRepository } from './courier.repository';

function mapCourierRow(row: {
  id: string;
  name: string;
  isAvailable: boolean;
  transportId: string | null;
}): CourierEntity {
  return {
    id: row.id,
    name: row.name,
    isAvailable: row.isAvailable,
    transportId: row.transportId ?? undefined,
  };
}

@Injectable()
export class CourierPrismaRepository extends CourierRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listAvailableCouriers(): Promise<CourierEntity[]> {
    const rows = await this.prisma.courier.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapCourierRow);
  }

  async listCouriers(args: ListRepoArgs): Promise<CourierEntity[]> {
    const orderBy = {
      [args.sortField]: args.order,
    } as Prisma.CourierOrderByWithRelationInput;
    const rows = await this.prisma.courier.findMany({
      skip: args.skip,
      take: args.take,
      orderBy,
    });
    return rows.map(mapCourierRow);
  }

  async getCourier(id: string): Promise<CourierEntity | undefined> {
    const row = await this.prisma.courier.findUnique({ where: { id } });
    return row ? mapCourierRow(row) : undefined;
  }

  async saveCourier(entity: CourierEntity): Promise<void> {
    await this.prisma.courier.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        name: entity.name,
        isAvailable: entity.isAvailable,
        transportId: entity.transportId ?? null,
      },
      update: {
        name: entity.name,
        isAvailable: entity.isAvailable,
        transportId: entity.transportId ?? null,
      },
    });
  }

  async countOrdersForCourier(_courierId: string): Promise<number> {
    return 0;
  }

  async deleteCourier(id: string): Promise<void> {
    await this.prisma.courier.delete({ where: { id } });
  }
}
