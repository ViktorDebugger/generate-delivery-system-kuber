import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CourierLocationEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import { CourierLocationRepository } from './courier-location.repository';

function mapRow(row: {
  id: string;
  courierId: string;
  orderId: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  recordedAt: Date;
}): CourierLocationEntity {
  return {
    id: row.id,
    courierId: row.courierId,
    orderId: row.orderId ?? undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    recordedAt: row.recordedAt.toISOString(),
  };
}

@Injectable()
export class CourierLocationPrismaRepository extends CourierLocationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(entity: CourierLocationEntity): Promise<void> {
    await this.prisma.courierLocation.create({
      data: {
        id: entity.id,
        courierId: entity.courierId,
        orderId: entity.orderId ?? null,
        latitude: entity.latitude,
        longitude: entity.longitude,
        recordedAt: new Date(entity.recordedAt),
      },
    });
  }

  async findLatestByCourierId(
    courierId: string,
  ): Promise<CourierLocationEntity | undefined> {
    const row = await this.prisma.courierLocation.findFirst({
      where: { courierId },
      orderBy: { recordedAt: 'desc' },
    });
    return row ? mapRow(row) : undefined;
  }
}
