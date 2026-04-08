import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { ClientEntity } from '../domain/entities';
import { PrismaService } from '../prisma/prisma.service';
import { ClientRepository } from './client.repository';

function mapClientRow(row: {
  id: string;
  fullName: string;
  email: string;
  address: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
}): ClientEntity {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    address: row.address ?? undefined,
    latitude: row.latitude !== null ? Number(row.latitude) : undefined,
    longitude: row.longitude !== null ? Number(row.longitude) : undefined,
  };
}

@Injectable()
export class ClientPrismaRepository extends ClientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listClients(args: ListRepoArgs): Promise<ClientEntity[]> {
    const orderBy = {
      [args.sortField]: args.order,
    } as Prisma.ClientOrderByWithRelationInput;
    const rows = await this.prisma.client.findMany({
      skip: args.skip,
      take: args.take,
      orderBy,
    });
    return rows.map(mapClientRow);
  }

  async getClient(id: string): Promise<ClientEntity | undefined> {
    const row = await this.prisma.client.findUnique({ where: { id } });
    return row ? mapClientRow(row) : undefined;
  }

  async saveClient(entity: ClientEntity): Promise<void> {
    await this.prisma.client.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        fullName: entity.fullName,
        email: entity.email,
        address: entity.address ?? null,
        latitude: entity.latitude ?? null,
        longitude: entity.longitude ?? null,
      },
      update: {
        fullName: entity.fullName,
        email: entity.email,
        address: entity.address ?? null,
        latitude: entity.latitude ?? null,
        longitude: entity.longitude ?? null,
      },
    });
  }

  async countOrdersForClient(clientId: string): Promise<number> {
    return this.prisma.order.count({
      where: {
        OR: [{ senderId: clientId }, { receiverId: clientId }],
      },
    });
  }

  async deleteClient(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }
}
