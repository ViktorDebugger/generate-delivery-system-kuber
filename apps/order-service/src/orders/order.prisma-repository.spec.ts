import { Prisma } from '@prisma/client';
import type { OrderEntity } from '../domain/entities';
import type { PrismaService } from '../prisma/prisma.service';
import { OrderPrismaRepository } from './order.prisma-repository';

describe('OrderPrismaRepository', () => {
  describe('saveOrder', () => {
    it('runs order upsert, deleteMany, createMany inside one $transaction', async () => {
      const tx = {
        order: { upsert: jest.fn().mockResolvedValue(undefined) },
        orderProduct: {
          deleteMany: jest.fn().mockResolvedValue(undefined),
          createMany: jest.fn().mockResolvedValue(undefined),
        },
      };
      const $transaction = jest.fn(
        async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
      );
      const prisma = {
        $transaction,
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      const entity: OrderEntity = {
        id: 'o1',
        orderNumber: 'ON',
        weight: 1,
        status: 'CREATED',
        senderId: 's',
        receiverId: 'r',
        courierId: 'c1',
        estimatedArrivalTime: '2026-01-01T00:00:00.000Z',
        productIds: ['p1', 'p2'],
      };

      await repo.saveOrder(entity);

      expect($transaction).toHaveBeenCalledTimes(1);
      expect(tx.order.upsert).toHaveBeenCalledWith({
        where: { id: 'o1' },
        create: {
          id: 'o1',
          orderNumber: 'ON',
          weight: new Prisma.Decimal(1),
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
          courierId: 'c1',
          estimatedArrivalTime: '2026-01-01T00:00:00.000Z',
        },
        update: {
          orderNumber: 'ON',
          weight: new Prisma.Decimal(1),
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
          courierId: 'c1',
          estimatedArrivalTime: '2026-01-01T00:00:00.000Z',
        },
      });
      expect(tx.orderProduct.deleteMany).toHaveBeenCalledWith({
        where: { orderId: 'o1' },
      });
      expect(tx.orderProduct.createMany).toHaveBeenCalledWith({
        data: [
          { orderId: 'o1', productId: 'p1' },
          { orderId: 'o1', productId: 'p2' },
        ],
      });
    });

    it('skips createMany when productIds empty', async () => {
      const tx = {
        order: { upsert: jest.fn().mockResolvedValue(undefined) },
        orderProduct: {
          deleteMany: jest.fn().mockResolvedValue(undefined),
          createMany: jest.fn(),
        },
      };
      const $transaction = jest.fn(
        async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
      );
      const prisma = {
        $transaction,
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      const entity: OrderEntity = {
        id: 'o2',
        orderNumber: 'X',
        weight: 2,
        status: 'ASSIGNED',
        senderId: 's',
        receiverId: 'r',
        courierId: undefined,
        productIds: [],
      };

      await repo.saveOrder(entity);

      expect($transaction).toHaveBeenCalledTimes(1);
      expect(tx.orderProduct.deleteMany).toHaveBeenCalledWith({
        where: { orderId: 'o2' },
      });
      expect(tx.orderProduct.createMany).not.toHaveBeenCalled();
    });
  });

  describe('listOrders', () => {
    it('maps rows with orderProducts to productIds', async () => {
      const findMany = jest.fn().mockResolvedValue([
        {
          id: 'o1',
          orderNumber: 'N',
          weight: { toNumber: () => 3.5 } as Prisma.Decimal,
          status: 'CREATED',
          senderId: 's',
          receiverId: 'r',
          courierId: null,
          estimatedArrivalTime: null,
          orderProducts: [{ productId: 'a' }, { productId: 'b' }],
        },
      ]);
      const prisma = {
        order: { findMany },
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      const rows = await repo.listOrders({
        skip: 0,
        take: 10,
        sortField: 'id',
        order: 'asc',
      });

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        id: 'o1',
        orderNumber: 'N',
        weight: 3.5,
        status: 'CREATED',
        senderId: 's',
        receiverId: 'r',
        courierId: undefined,
        estimatedArrivalTime: undefined,
        productIds: ['a', 'b'],
      });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          include: { orderProducts: true },
        }),
      );
    });

    it('passes insensitive status filter when status set', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = {
        order: { findMany },
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      await repo.listOrders({
        skip: 0,
        take: 5,
        sortField: 'weight',
        order: 'desc',
        status: 'in_transit',
      });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { equals: 'in_transit', mode: 'insensitive' },
          },
        }),
      );
    });
  });

  describe('getOrder', () => {
    it('returns undefined when not found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = {
        order: { findUnique },
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      await expect(repo.getOrder('missing')).resolves.toBeUndefined();
    });

    it('maps findUnique row', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: 'o9',
        orderNumber: 'Z',
        weight: { toNumber: () => 1 } as Prisma.Decimal,
        status: 'DELIVERED',
        senderId: 's',
        receiverId: 'r',
        courierId: 'c9',
        estimatedArrivalTime: '2026-02-02',
        orderProducts: [{ productId: 'p1' }],
      });
      const prisma = {
        order: { findUnique },
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      const result = await repo.getOrder('o9');

      expect(result).toEqual({
        id: 'o9',
        orderNumber: 'Z',
        weight: 1,
        status: 'DELIVERED',
        senderId: 's',
        receiverId: 'r',
        courierId: 'c9',
        estimatedArrivalTime: '2026-02-02',
        productIds: ['p1'],
      });
    });
  });

  describe('deleteOrder', () => {
    it('delegates to prisma.order.delete', async () => {
      const del = jest.fn().mockResolvedValue(undefined);
      const prisma = {
        order: { delete: del },
      } as unknown as PrismaService;

      const repo = new OrderPrismaRepository(prisma);
      await repo.deleteOrder('x');

      expect(del).toHaveBeenCalledWith({ where: { id: 'x' } });
    });
  });
});
