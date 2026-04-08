import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { TransportEntity } from '../domain/entities';

export abstract class TransportRepository {
  abstract listTransports(args: ListRepoArgs): Promise<TransportEntity[]>;
  abstract getTransport(id: string): Promise<TransportEntity | undefined>;
  abstract saveTransport(entity: TransportEntity): Promise<void>;
  abstract countCouriersForTransport(transportId: string): Promise<number>;
  abstract deleteTransport(id: string): Promise<void>;
}
