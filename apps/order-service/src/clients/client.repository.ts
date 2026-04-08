import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { ClientEntity } from '../domain/entities';

export abstract class ClientRepository {
  abstract listClients(args: ListRepoArgs): Promise<ClientEntity[]>;
  abstract getClient(id: string): Promise<ClientEntity | undefined>;
  abstract saveClient(entity: ClientEntity): Promise<void>;
  abstract countOrdersForClient(clientId: string): Promise<number>;
  abstract deleteClient(id: string): Promise<void>;
}
