import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { buildListRepoArgs } from '../common/list-query/list-query.util';
import type { TransportEntity } from '../domain/entities';
import type { CreateTransportDto } from './dto/create-transport.dto';
import type { UpdateTransportDto } from './dto/update-transport.dto';
import { TransportRepository } from './transport.repository';

const TRANSPORT_SORT_PAIRS = [
  ['id', 'id'],
  ['name', 'name'],
] as const;

@Injectable()
export class TransportsService {
  constructor(private readonly transports: TransportRepository) {}

  async findAll(
    page = 0,
    size = 10,
    sort?: string,
    order?: string,
  ): Promise<TransportEntity[]> {
    const args = buildListRepoArgs(
      page,
      size,
      sort,
      order,
      TRANSPORT_SORT_PAIRS,
      'id',
    );
    return this.transports.listTransports(args);
  }

  async findOne(id: string): Promise<TransportEntity> {
    const entity = await this.transports.getTransport(id);
    if (!entity) {
      throw new NotFoundException(`Транспорт з ID ${id} не знайдено`);
    }
    return entity;
  }

  async create(dto: CreateTransportDto): Promise<TransportEntity> {
    const entity: TransportEntity = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
    };
    await this.transports.saveTransport(entity);
    return entity;
  }

  async update(id: string, dto: UpdateTransportDto): Promise<TransportEntity> {
    const existing = await this.transports.getTransport(id);
    if (!existing) {
      throw new NotFoundException(`Транспорт з ID ${id} не знайдено`);
    }
    const entity: TransportEntity = {
      id,
      name: dto.name ?? existing.name,
      description:
        dto.description !== undefined ? dto.description : existing.description,
    };
    await this.transports.saveTransport(entity);
    return entity;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.transports.getTransport(id);
    if (!existing) {
      throw new NotFoundException(`Транспорт з ID ${id} не знайдено`);
    }
    const courierCount = await this.transports.countCouriersForTransport(id);
    if (courierCount > 0) {
      throw new ConflictException(
        `Неможливо видалити транспорт з ID ${id}: є пов'язані кур'єри`,
      );
    }
    await this.transports.deleteTransport(id);
  }
}
