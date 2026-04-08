import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { TransportEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import { TransportRepository } from './transport.repository';

function mapTransportRow(row: {
  id: string;
  name: string;
  description: string | null;
}): TransportEntity {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
  };
}

@Injectable()
export class TransportPrismaRepository extends TransportRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listTransports(args: ListRepoArgs): Promise<TransportEntity[]> {
    const orderBy = {
      [args.sortField]: args.order,
    } as Prisma.TransportOrderByWithRelationInput;
    const rows = await this.prisma.transport.findMany({
      skip: args.skip,
      take: args.take,
      orderBy,
    });
    return rows.map(mapTransportRow);
  }

  async getTransport(id: string): Promise<TransportEntity | undefined> {
    const row = await this.prisma.transport.findUnique({ where: { id } });
    return row ? mapTransportRow(row) : undefined;
  }

  async saveTransport(entity: TransportEntity): Promise<void> {
    await this.prisma.transport.upsert({
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

  async countCouriersForTransport(transportId: string): Promise<number> {
    return this.prisma.courier.count({
      where: { transportId },
    });
  }

  async deleteTransport(id: string): Promise<void> {
    await this.prisma.transport.delete({ where: { id } });
  }
}
