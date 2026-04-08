import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { buildListRepoArgs } from '../common/list-query/list-query.util';
import type { CourierEntity, CourierResponse } from '../domain/entities';
import { TransportRepository } from '../transports/transport.repository';
import { CourierRepository } from './courier.repository';
import type { CreateCourierDto } from './dto/create-courier.dto';
import type { UpdateCourierDto } from './dto/update-courier.dto';

const COURIER_SORT_PAIRS = [
  ['id', 'id'],
  ['name', 'name'],
  ['isavailable', 'isAvailable'],
  ['transportid', 'transportId'],
] as const;

@Injectable()
export class CouriersService {
  constructor(
    private readonly couriers: CourierRepository,
    private readonly transports: TransportRepository,
  ) {}

  async findAllAvailable(): Promise<CourierResponse[]> {
    const list = await this.couriers.listAvailableCouriers();
    return Promise.all(list.map((c) => this.toResponse(c)));
  }

  async findAll(
    page = 0,
    size = 10,
    sort?: string,
    order?: string,
  ): Promise<CourierResponse[]> {
    const args = buildListRepoArgs(
      page,
      size,
      sort,
      order,
      COURIER_SORT_PAIRS,
      'id',
    );
    const list = await this.couriers.listCouriers(args);
    return Promise.all(list.map((c) => this.toResponse(c)));
  }

  async findOne(id: string): Promise<CourierResponse> {
    const entity = await this.couriers.getCourier(id);
    if (!entity) {
      throw new NotFoundException(`Кур'єр з ID ${id} не знайдено`);
    }
    return this.toResponse(entity);
  }

  async create(dto: CreateCourierDto): Promise<CourierResponse> {
    await this.assertTransportExistsIfSet(dto.transportId);
    const entity: CourierEntity = {
      id: randomUUID(),
      name: dto.name,
      transportId: dto.transportId,
      isAvailable: dto.isAvailable ?? true,
    };
    await this.couriers.saveCourier(entity);
    return this.toResponse(entity);
  }

  async update(id: string, dto: UpdateCourierDto): Promise<CourierResponse> {
    const existing = await this.couriers.getCourier(id);
    if (!existing) {
      throw new NotFoundException(`Кур'єр з ID ${id} не знайдено`);
    }
    const transportId =
      dto.transportId !== undefined ? dto.transportId : existing.transportId;
    await this.assertTransportExistsIfSet(transportId);
    const entity: CourierEntity = {
      id,
      name: dto.name ?? existing.name,
      transportId,
      isAvailable:
        dto.isAvailable !== undefined ? dto.isAvailable : existing.isAvailable,
    };
    await this.couriers.saveCourier(entity);
    return this.toResponse(entity);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.couriers.getCourier(id);
    if (!existing) {
      throw new NotFoundException(`Кур'єр з ID ${id} не знайдено`);
    }
    const orderCount = await this.couriers.countOrdersForCourier(id);
    if (orderCount > 0) {
      throw new ConflictException(
        `Неможливо видалити кур'єра з ID ${id}: є пов'язані замовлення`,
      );
    }
    await this.couriers.deleteCourier(id);
  }

  private async assertTransportExistsIfSet(
    transportId: string | undefined,
  ): Promise<void> {
    if (transportId !== undefined && transportId !== '') {
      const t = await this.transports.getTransport(transportId);
      if (!t) {
        throw new BadRequestException(
          `Транспорт з ID ${transportId} не знайдено`,
        );
      }
    }
  }

  private async toResponse(entity: CourierEntity): Promise<CourierResponse> {
    const transport =
      entity.transportId !== undefined && entity.transportId !== ''
        ? await this.transports.getTransport(entity.transportId)
        : undefined;
    const out: CourierResponse = { ...entity };
    if (transport !== undefined) {
      out.transport = transport;
    }
    return out;
  }
}
