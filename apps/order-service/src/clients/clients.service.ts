import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { buildListRepoArgs } from '../common/list-query/list-query.util';
import type { ClientEntity } from '../domain/entities';
import { ClientRepository } from './client.repository';
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

const CLIENT_SORT_PAIRS = [
  ['id', 'id'],
  ['fullname', 'fullName'],
  ['email', 'email'],
] as const;

@Injectable()
export class ClientsService {
  constructor(private readonly clients: ClientRepository) {}

  async findAll(
    page = 0,
    size = 10,
    sort?: string,
    order?: string,
  ): Promise<ClientEntity[]> {
    const args = buildListRepoArgs(
      page,
      size,
      sort,
      order,
      CLIENT_SORT_PAIRS,
      'id',
    );
    return this.clients.listClients(args);
  }

  async findOne(id: string): Promise<ClientEntity> {
    const entity = await this.clients.getClient(id);
    if (!entity) {
      throw new NotFoundException(`Клієнт з ID ${id} не знайдено`);
    }
    return entity;
  }

  async create(dto: CreateClientDto): Promise<ClientEntity> {
    const entity: ClientEntity = {
      id: randomUUID(),
      fullName: dto.fullName,
      email: dto.email,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
    try {
      await this.clients.saveClient(entity);
    } catch (e) {
      this.rethrowUniqueEmail(e);
    }
    return entity;
  }

  async update(id: string, dto: UpdateClientDto): Promise<ClientEntity> {
    const existing = await this.clients.getClient(id);
    if (!existing) {
      throw new NotFoundException(`Клієнт з ID ${id} не знайдено`);
    }
    const entity: ClientEntity = {
      id,
      fullName: dto.fullName ?? existing.fullName,
      email: dto.email ?? existing.email,
      address: dto.address !== undefined ? dto.address : existing.address,
      latitude: dto.latitude !== undefined ? dto.latitude : existing.latitude,
      longitude:
        dto.longitude !== undefined ? dto.longitude : existing.longitude,
    };
    try {
      await this.clients.saveClient(entity);
    } catch (e) {
      this.rethrowUniqueEmail(e);
    }
    return entity;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.clients.getClient(id);
    if (!existing) {
      throw new NotFoundException(`Клієнт з ID ${id} не знайдено`);
    }
    const ordersCount = await this.clients.countOrdersForClient(id);
    if (ordersCount > 0) {
      throw new ConflictException(
        `Неможливо видалити клієнта з ID ${id}: є пов'язані замовлення`,
      );
    }
    await this.clients.deleteClient(id);
  }

  private rethrowUniqueEmail(e: unknown): never {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException('Клієнт з таким email вже існує');
    }
    throw e;
  }
}
