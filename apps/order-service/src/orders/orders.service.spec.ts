import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ClientEntity, OrderEntity } from '../domain/entities';
import { ClientRepository } from '../clients/client.repository';
import { CatalogClient } from '../integration/catalog.client';
import { FleetClient } from '../integration/fleet.client';
import { OrderDeliveryStatus } from './order-delivery-status';
import { OrderRepository } from './order.repository';
import { OrdersService } from './orders.service';

function order(
  overrides: Partial<OrderEntity> &
    Pick<
      OrderEntity,
      'id' | 'orderNumber' | 'weight' | 'status' | 'senderId' | 'receiverId'
    >,
): OrderEntity {
  return {
    productIds: [],
    ...overrides,
  };
}

function toResp(e: OrderEntity) {
  return {
    id: e.id,
    orderNumber: e.orderNumber,
    weight: e.weight,
    status: e.status,
    senderId: e.senderId,
    receiverId: e.receiverId,
    courierId: e.courierId,
    estimatedArrivalTime: e.estimatedArrivalTime,
    products: e.productIds.map((id) => ({ id })),
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let orders: jest.Mocked<
    Pick<
      OrderRepository,
      'listOrders' | 'getOrder' | 'saveOrder' | 'deleteOrder'
    >
  >;
  let clients: jest.Mocked<
    Pick<
      ClientRepository,
      | 'listClients'
      | 'getClient'
      | 'saveClient'
      | 'countOrdersForClient'
      | 'deleteClient'
    >
  >;
  let catalog: jest.Mocked<Pick<CatalogClient, 'assertProductsExist'>>;
  let fleet: jest.Mocked<
    Pick<FleetClient, 'requireCourierAssignable' | 'pickAvailableCourierId'>
  >;

  beforeEach(async () => {
    jest.clearAllMocks();
    orders = {
      listOrders: jest.fn(),
      getOrder: jest.fn(),
      saveOrder: jest.fn().mockResolvedValue(undefined),
      deleteOrder: jest.fn(),
    };
    clients = {
      listClients: jest.fn(),
      getClient: jest.fn(),
      saveClient: jest.fn(),
      countOrdersForClient: jest.fn(),
      deleteClient: jest.fn(),
    };
    catalog = {
      assertProductsExist: jest.fn().mockResolvedValue(undefined),
    };
    fleet = {
      requireCourierAssignable: jest.fn().mockResolvedValue(undefined),
      pickAvailableCourierId: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrderRepository, useValue: orders },
        { provide: ClientRepository, useValue: clients },
        { provide: CatalogClient, useValue: catalog },
        { provide: FleetClient, useValue: fleet },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  function mockClientsExist(): void {
    clients.getClient.mockImplementation((id: string) =>
      Promise.resolve({ id, fullName: 'N', email: `${id}@e.test` }),
    );
  }

  function firstSavedOrder(): OrderEntity {
    const calls = orders.saveOrder.mock.calls as Array<[OrderEntity]>;
    const row = calls[0];
    if (row === undefined) {
      throw new Error('expected saveOrder');
    }
    return row[0];
  }

  describe('findAll', () => {
    it('filters by status case-insensitively', async () => {
      const ent = order({
        id: '1',
        orderNumber: 'A',
        weight: 1,
        status: 'IN_TRANSIT',
        senderId: 's',
        receiverId: 'r',
      });
      orders.listOrders.mockResolvedValue([ent]);

      const result = await service.findAll('in_transit');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(toResp(ent));
      expect(orders.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_transit',
          sortField: 'id',
          order: 'asc',
        }),
      );
    });

    it('returns empty array when filter matches nothing', async () => {
      orders.listOrders.mockResolvedValue([]);
      await expect(service.findAll('IN_TRANSIT')).resolves.toEqual([]);
    });

    it('does not filter when status is undefined or empty', async () => {
      const items = [
        order({
          id: '1',
          orderNumber: 'A',
          weight: 1,
          status: 'X',
          senderId: 's',
          receiverId: 'r',
        }),
      ];
      orders.listOrders.mockResolvedValue(items);
      await expect(service.findAll(undefined)).resolves.toHaveLength(1);
      orders.listOrders.mockResolvedValue(items);
      await expect(service.findAll('')).resolves.toHaveLength(1);
    });

    it('sorts by weight ascending', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'a',
          orderNumber: 'Z',
          weight: 10,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
        order({
          id: 'b',
          orderNumber: 'Z',
          weight: 20,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
        order({
          id: 'c',
          orderNumber: 'Z',
          weight: 30,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const result = await service.findAll(undefined, 0, 10, 'weight', 'asc');
      expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('sorts by orderNumber lexicographically', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'y',
          orderNumber: 'A-9',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
        order({
          id: 'x',
          orderNumber: 'B-2',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const result = await service.findAll(
        undefined,
        0,
        10,
        'orderNumber',
        'asc',
      );
      expect(result.map((r) => r.orderNumber)).toEqual(['A-9', 'B-2']);
    });

    it('accepts OrderNumber casing for sort key', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'y',
          orderNumber: 'A',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
        order({
          id: 'x',
          orderNumber: 'Z',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const result = await service.findAll(
        undefined,
        0,
        10,
        'OrderNumber',
        'asc',
      );
      expect(result.map((r) => r.orderNumber)).toEqual(['A', 'Z']);
    });

    it('sorts by id when sort key is unknown', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'a',
          orderNumber: 'Z',
          weight: 99,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
        order({
          id: 'm',
          orderNumber: 'Z',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const result = await service.findAll(undefined, 0, 10, 'nope', 'asc');
      expect(result.map((r) => r.id)).toEqual(['a', 'm']);
    });

    it('paginates with page=0 and size=2', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'w1',
          orderNumber: 'Z',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
        order({
          id: 'w2',
          orderNumber: 'Z',
          weight: 2,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const result = await service.findAll(undefined, 0, 2, 'weight', 'asc');
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['w1', 'w2']);
      expect(orders.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 2, sortField: 'weight' }),
      );
    });

    it('returns second page slice', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'w3',
          orderNumber: 'Z',
          weight: 3,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const result = await service.findAll(undefined, 1, 2, 'weight', 'asc');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('w3');
      expect(orders.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 2, take: 2 }),
      );
    });

    it('passes desc order to repository', async () => {
      orders.listOrders.mockResolvedValue([]);
      await service.findAll(undefined, 0, 10, 'weight', 'desc');
      expect(orders.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({ order: 'desc', sortField: 'weight' }),
      );
    });

    it('returns empty when listOrders is empty', async () => {
      orders.listOrders.mockResolvedValue([]);
      await expect(service.findAll(undefined)).resolves.toEqual([]);
    });

    it('uses safe page 0 and safe size 10 for invalid pagination', async () => {
      orders.listOrders.mockResolvedValue([
        order({
          id: 'only',
          orderNumber: 'Z',
          weight: 1,
          status: 'S',
          senderId: 's',
          receiverId: 'r',
        }),
      ]);

      const badPage = await service.findAll(
        undefined,
        Number.NaN,
        100,
        'id',
        'asc',
      );
      expect(badPage).toHaveLength(1);

      orders.listOrders.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) =>
          order({
            id: `x${i}`,
            orderNumber: 'Z',
            weight: 1,
            status: 'S',
            senderId: 's',
            receiverId: 'r',
          }),
        ),
      );

      const badSize = await service.findAll(undefined, 0, 0, 'id', 'asc');
      expect(badSize.length).toBe(10);
      expect(orders.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('returns order response when order exists', async () => {
      const entity = order({
        id: 'o-1',
        orderNumber: 'N-1',
        weight: 5,
        status: 'CREATED',
        senderId: 's1',
        receiverId: 'r1',
      });
      orders.getOrder.mockResolvedValue(entity);

      const result = await service.findOne('o-1');
      expect(result).toEqual(toResp(entity));
    });

    it('includes product id stubs from productIds', async () => {
      const entity = order({
        id: 'o-1',
        orderNumber: 'N-1',
        weight: 5,
        status: 'CREATED',
        senderId: 's1',
        receiverId: 'r1',
        productIds: ['p1', 'p2'],
      });
      orders.getOrder.mockResolvedValue(entity);
      await expect(service.findOne('o-1')).resolves.toEqual(toResp(entity));
    });

    it('throws NotFoundException when order is missing', async () => {
      orders.getOrder.mockResolvedValue(undefined);
      await expect(service.findOne('gone')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('gone')).rejects.toThrow(
        'Замовлення з ID gone не знайдено',
      );
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockClientsExist();
    });

    it('saves CREATED when no courier and fleet returns none', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue(undefined);
      const result = await service.create({
        orderNumber: 'U1',
        weight: 1.5,
        senderId: 's1',
        receiverId: 'r1',
        productIds: ['p1'],
      });
      expect(catalog.assertProductsExist).toHaveBeenCalledWith(['p1']);
      expect(orders.saveOrder).toHaveBeenCalled();
      expect(result.status).toBe('CREATED');
      expect(result.products).toEqual([{ id: 'p1' }]);
    });

    it('assigns courier when dto.courierId set', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue(undefined);
      const result = await service.create({
        orderNumber: 'U2',
        weight: 1,
        senderId: 's1',
        receiverId: 'r1',
        courierId: 'c1',
        productIds: [],
      });
      expect(fleet.requireCourierAssignable).toHaveBeenCalledWith('c1');
      expect(result.status).toBe('ASSIGNED');
      expect(result.courierId).toBe('c1');
    });

    it('auto-assigns via fleet.pickAvailableCourierId', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue('c-a');
      await service.create({
        orderNumber: 'AUTO',
        weight: 1,
        senderId: 's',
        receiverId: 'r',
      });
      const saved = firstSavedOrder();
      expect(saved.courierId).toBe('c-a');
      expect(saved.status).toBe(OrderDeliveryStatus.ASSIGNED);
    });

    it('throws when ASSIGNED is requested but no courier is available', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue(undefined);
      await expect(
        service.create({
          orderNumber: 'X',
          weight: 1,
          status: OrderDeliveryStatus.ASSIGNED,
          senderId: 's',
          receiverId: 'r',
        }),
      ).rejects.toThrow('Немає вільного кур’єра для призначення');
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('throws when courier is not available', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue(undefined);
      fleet.requireCourierAssignable.mockRejectedValue(
        new BadRequestException(`Кур'єр з ID c1 недоступний`),
      );
      await expect(
        service.create({
          orderNumber: 'O',
          weight: 1,
          senderId: 's',
          receiverId: 'r',
          courierId: 'c1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('rethrows catalog validation errors', async () => {
      catalog.assertProductsExist.mockRejectedValue(
        new BadRequestException('Товар з ID bad не знайдено'),
      );
      await expect(
        service.create({
          orderNumber: 'U3',
          weight: 1,
          senderId: 's1',
          receiverId: 'r1',
          productIds: ['bad'],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('saves CANCELLED when initial status is CANCELLED', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue(undefined);
      const result = await service.create({
        orderNumber: 'CAN',
        weight: 1,
        senderId: 's',
        receiverId: 'r',
        status: OrderDeliveryStatus.CANCELLED,
      });
      expect(result.status).toBe(OrderDeliveryStatus.CANCELLED);
      expect(result.courierId).toBeUndefined();
      expect(firstSavedOrder().status).toBe(OrderDeliveryStatus.CANCELLED);
    });

    it('rejects IN_TRANSIT as initial status', async () => {
      await expect(
        service.create({
          orderNumber: 'O',
          weight: 1,
          senderId: 's',
          receiverId: 'r',
          status: OrderDeliveryStatus.IN_TRANSIT,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('deduplicates productIds before catalog check', async () => {
      fleet.pickAvailableCourierId.mockResolvedValue(undefined);
      await service.create({
        orderNumber: 'D',
        weight: 1,
        senderId: 's',
        receiverId: 'r',
        productIds: ['p1', ' p1 ', 'p2'],
      });
      expect(catalog.assertProductsExist).toHaveBeenCalledWith(['p1', 'p2']);
      expect(firstSavedOrder().productIds).toEqual(['p1', 'p2']);
    });

    it('throws BadRequest when sender missing', async () => {
      clients.getClient.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'r' ? { id: 'r', fullName: 'R', email: 'r@e' } : undefined,
        ),
      );
      await expect(
        service.create({
          orderNumber: 'O',
          weight: 1,
          senderId: 's',
          receiverId: 'r',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    function wireClients(sId: string, rId: string): void {
      clients.getClient.mockImplementation((id: string) => {
        if (id === sId || id === rId) {
          return Promise.resolve({
            id,
            fullName: 'N',
            email: `${id}@x.com`,
          });
        }
        return Promise.resolve(undefined);
      });
    }

    it('merges fields and replaces productIds when productIds provided', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N0',
          weight: 1,
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
          productIds: ['p-old'],
        }),
      );
      wireClients('s', 'r');

      await service.update('o1', {
        orderNumber: 'N1',
        weight: 3,
        productIds: ['p-new'],
      });

      expect(catalog.assertProductsExist).toHaveBeenCalledWith(['p-new']);
      expect(orders.saveOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'o1',
          orderNumber: 'N1',
          weight: 3,
          productIds: ['p-new'],
          senderId: 's',
          receiverId: 'r',
        }),
      );
    });

    it('keeps existing productIds when productIds omitted', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N0',
          weight: 1,
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
          productIds: ['p-a'],
        }),
      );
      wireClients('s', 'r');

      await service.update('o1', { orderNumber: 'N2' });

      expect(orders.saveOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'N2',
          productIds: ['p-a'],
        }),
      );
    });

    it('validates courier via fleet when courierId set', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
          courierId: 'c0',
        }),
      );
      wireClients('s', 'r');
      fleet.requireCourierAssignable.mockRejectedValue(
        new BadRequestException('x'),
      );

      await expect(
        service.update('o1', { courierId: 'c-missing' }),
      ).rejects.toThrow(BadRequestException);
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('allows status transition ASSIGNED to IN_TRANSIT', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: OrderDeliveryStatus.ASSIGNED,
          senderId: 's',
          receiverId: 'r',
          courierId: 'c1',
        }),
      );
      wireClients('s', 'r');

      await service.update('o1', { status: OrderDeliveryStatus.IN_TRANSIT });

      expect(orders.saveOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderDeliveryStatus.IN_TRANSIT,
        }),
      );
    });

    it('rejects forbidden status transition CREATED to DELIVERED', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: OrderDeliveryStatus.CREATED,
          senderId: 's',
          receiverId: 'r',
        }),
      );
      wireClients('s', 'r');

      await expect(
        service.update('o1', { status: OrderDeliveryStatus.DELIVERED }),
      ).rejects.toThrow(/Заборонений перехід статусу/);
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when order is missing', async () => {
      orders.getOrder.mockResolvedValue(undefined);
      await expect(service.update('gone', { weight: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when sender client is missing', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
        }),
      );
      clients.getClient.mockResolvedValue(undefined);

      await expect(service.update('o1', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    function wireClients(sId: string, rId: string): void {
      clients.getClient.mockImplementation((id: string) => {
        if (id === sId || id === rId) {
          return Promise.resolve({
            id,
            fullName: 'N',
            email: `${id}@x.com`,
          });
        }
        return Promise.resolve(undefined);
      });
    }

    it('applies allowed transition like PUT', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: OrderDeliveryStatus.ASSIGNED,
          senderId: 's',
          receiverId: 'r',
          courierId: 'c1',
        }),
      );
      wireClients('s', 'r');

      await service.updateStatus('o1', {
        status: OrderDeliveryStatus.IN_TRANSIT,
      });

      expect(orders.saveOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderDeliveryStatus.IN_TRANSIT,
        }),
      );
    });

    it('rejects forbidden transition', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: OrderDeliveryStatus.CANCELLED,
          senderId: 's',
          receiverId: 'r',
        }),
      );
      wireClients('s', 'r');

      await expect(
        service.updateStatus('o1', { status: OrderDeliveryStatus.DELIVERED }),
      ).rejects.toThrow(/Заборонений перехід статусу/);
      expect(orders.saveOrder).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when order is missing', async () => {
      orders.getOrder.mockResolvedValue(undefined);
      await expect(
        service.updateStatus('gone', {
          status: OrderDeliveryStatus.IN_TRANSIT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('calls deleteOrder when order exists', async () => {
      orders.getOrder.mockResolvedValue(
        order({
          id: 'o1',
          orderNumber: 'N',
          weight: 1,
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
        }),
      );
      orders.deleteOrder.mockResolvedValue(undefined);

      await expect(service.remove('o1')).resolves.toBeUndefined();
      expect(orders.deleteOrder).toHaveBeenCalledWith('o1');
    });

    it('throws NotFoundException when order is missing', async () => {
      orders.getOrder.mockResolvedValue(undefined);
      await expect(service.remove('gone')).rejects.toThrow(NotFoundException);
      expect(orders.deleteOrder).not.toHaveBeenCalled();
    });
  });

  describe('findOneWithSender', () => {
    it('returns order with sender from client repository', async () => {
      const entity = order({
        id: 'ord-1',
        orderNumber: 'N-9',
        weight: 4,
        status: 'CREATED',
        senderId: 'client-s',
        receiverId: 'client-r',
      });
      const sender: ClientEntity = {
        id: 'client-s',
        fullName: 'Sender Name',
        email: 'sender@example.com',
      };
      orders.getOrder.mockResolvedValue(entity);
      clients.getClient.mockResolvedValue(sender);

      const result = await service.findOneWithSender('ord-1');

      expect(clients.getClient).toHaveBeenCalledWith('client-s');
      expect(result.sender).toEqual(sender);
      expect(result.id).toBe('ord-1');
      expect(result.orderNumber).toBe('N-9');
      expect(result.senderId).toBe('client-s');
      expect(result.receiverId).toBe('client-r');
      expect(result.products).toEqual([]);
    });

    it('throws NotFoundException when order is missing', async () => {
      orders.getOrder.mockResolvedValue(undefined);
      await expect(service.findOneWithSender('gone')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneWithSender('gone')).rejects.toThrow(
        'Замовлення з ID gone не знайдено',
      );
      expect(clients.getClient).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when sender client is missing', async () => {
      const entity = order({
        id: 'ord-2',
        orderNumber: 'X',
        weight: 1,
        status: 'S',
        senderId: 'no-such-sender',
        receiverId: 'r',
      });
      orders.getOrder.mockResolvedValue(entity);
      clients.getClient.mockResolvedValue(undefined);

      await expect(service.findOneWithSender('ord-2')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneWithSender('ord-2')).rejects.toThrow(
        'Клієнт-відправник з ID no-such-sender не знайдено',
      );
    });
  });
});
