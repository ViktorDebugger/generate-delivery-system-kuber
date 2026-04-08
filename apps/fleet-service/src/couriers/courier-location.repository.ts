import type { CourierLocationEntity } from '../domain/entities';

export abstract class CourierLocationRepository {
  abstract save(entity: CourierLocationEntity): Promise<void>;
  abstract findLatestByCourierId(
    courierId: string,
  ): Promise<CourierLocationEntity | undefined>;
}
