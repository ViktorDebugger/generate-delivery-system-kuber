import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { CourierEntity } from '../domain/entities';

export abstract class CourierRepository {
  abstract listCouriers(args: ListRepoArgs): Promise<CourierEntity[]>;
  abstract listAvailableCouriers(): Promise<CourierEntity[]>;
  abstract getCourier(id: string): Promise<CourierEntity | undefined>;
  abstract saveCourier(entity: CourierEntity): Promise<void>;
  abstract countOrdersForCourier(courierId: string): Promise<number>;
  abstract deleteCourier(id: string): Promise<void>;
}
