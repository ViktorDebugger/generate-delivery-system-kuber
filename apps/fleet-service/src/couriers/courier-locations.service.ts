import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CourierLocationResponse } from '../domain/entities';
import { CourierLocationRepository } from './courier-location.repository';
import { CourierRepository } from './courier.repository';
import type { CreateCourierLocationDto } from './dto/create-courier-location.dto';

@Injectable()
export class CourierLocationsService {
  constructor(
    private readonly couriers: CourierRepository,
    private readonly locations: CourierLocationRepository,
  ) {}

  async recordLocation(
    courierId: string,
    dto: CreateCourierLocationDto,
  ): Promise<CourierLocationResponse> {
    const courier = await this.couriers.getCourier(courierId);
    if (!courier) {
      throw new NotFoundException(`Кур'єр з ID ${courierId} не знайдено`);
    }
    const recordedAt = new Date().toISOString();
    const linkedOrderId =
      dto.orderId !== undefined && dto.orderId !== '' ? dto.orderId : undefined;
    const entity = {
      id: randomUUID(),
      courierId,
      orderId: linkedOrderId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      recordedAt,
    };
    await this.locations.save(entity);
    return entity;
  }

  async getLatestForCourier(
    courierId: string,
  ): Promise<CourierLocationResponse> {
    const courier = await this.couriers.getCourier(courierId);
    if (!courier) {
      throw new NotFoundException(`Кур'єр з ID ${courierId} не знайдено`);
    }
    const loc = await this.locations.findLatestByCourierId(courierId);
    if (!loc) {
      throw new NotFoundException(
        `Для кур'єра з ID ${courierId} ще немає збережених координат`,
      );
    }
    return loc;
  }
}
