import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { OrderEntity } from '../domain/entities';

export type ListOrdersRepoParams = ListRepoArgs & {
  status?: string;
};

export abstract class OrderRepository {
  abstract listOrders(params: ListOrdersRepoParams): Promise<OrderEntity[]>;
  abstract getOrder(id: string): Promise<OrderEntity | undefined>;
  abstract saveOrder(entity: OrderEntity): Promise<void>;
  abstract deleteOrder(id: string): Promise<void>;
}
