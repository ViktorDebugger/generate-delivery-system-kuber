import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CourierEntity, TransportEntity } from '../domain/entities';
import { TransportRepository } from '../transports/transport.repository';
import { CourierRepository } from './courier.repository';
import type { CreateCourierDto } from './dto/create-courier.dto';
import type { UpdateCourierDto } from './dto/update-courier.dto';
import { CouriersService } from './couriers.service';

describe('CouriersService', () => {
  let service: CouriersService;
  let couriers: jest.Mocked<
    Pick<
      CourierRepository,
      | 'listCouriers'
      | 'listAvailableCouriers'
      | 'getCourier'
      | 'saveCourier'
      | 'countOrdersForCourier'
      | 'deleteCourier'
    >
  >;
  let transports: jest.Mocked<Pick<TransportRepository, 'getTransport'>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    couriers = {
      listCouriers: jest.fn(),
      listAvailableCouriers: jest.fn(),
      getCourier: jest.fn(),
      saveCourier: jest.fn().mockResolvedValue(undefined),
      countOrdersForCourier: jest.fn(),
      deleteCourier: jest.fn().mockResolvedValue(undefined),
    };
    transports = {
      getTransport: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CouriersService,
        { provide: CourierRepository, useValue: couriers },
        { provide: TransportRepository, useValue: transports },
      ],
    }).compile();

    service = moduleRef.get(CouriersService);
  });

  const transportT1: TransportEntity = { id: 't1', name: 'Bike' };

  describe('findAllAvailable', () => {
    it('embeds transport when transportId set', async () => {
      couriers.listAvailableCouriers.mockResolvedValue([
        {
          id: 'c1',
          name: 'A',
          isAvailable: true,
          transportId: 't1',
        },
      ]);
      transports.getTransport.mockImplementation((id: string) =>
        Promise.resolve(
          id === 't1'
            ? { id: 't1', name: 'Bike', description: 'x' }
            : undefined,
        ),
      );
      const out = await service.findAllAvailable();
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({
        id: 'c1',
        transportId: 't1',
        transport: { id: 't1', name: 'Bike' },
      });
    });
  });

  describe('findAll', () => {
    it('returns list from repository with embedded transport when transportId set', async () => {
      const list: CourierEntity[] = [
        {
          id: 'c1',
          name: 'Ann',
          transportId: 't1',
          isAvailable: true,
        },
      ];
      couriers.listCouriers.mockResolvedValue(list);
      transports.getTransport.mockResolvedValue(transportT1);
      await expect(service.findAll()).resolves.toEqual([
        {
          ...list[0],
          transport: transportT1,
        },
      ]);
      expect(couriers.listCouriers).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          sortField: 'id',
          order: 'asc',
        }),
      );
      expect(transports.getTransport).toHaveBeenCalledWith('t1');
    });

    it('omits transport when courier has no transportId', async () => {
      const list: CourierEntity[] = [
        {
          id: 'c1',
          name: 'Ann',
          isAvailable: true,
        },
      ];
      couriers.listCouriers.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toEqual(list);
      expect(transports.getTransport).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns courier with transport when repository has both', async () => {
      const entity: CourierEntity = {
        id: 'x',
        name: 'Bob',
        transportId: 't1',
        isAvailable: false,
      };
      couriers.getCourier.mockResolvedValue(entity);
      transports.getTransport.mockResolvedValue(transportT1);
      await expect(service.findOne('x')).resolves.toEqual({
        ...entity,
        transport: transportT1,
      });
      expect(couriers.getCourier).toHaveBeenCalledWith('x');
      expect(transports.getTransport).toHaveBeenCalledWith('t1');
    });

    it('throws NotFoundException when courier is missing', async () => {
      couriers.getCourier.mockResolvedValue(undefined);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing')).rejects.toThrow(
        "Кур'єр з ID missing не знайдено",
      );
    });
  });

  describe('create', () => {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('generates id, saves and maps dto fields with transportId', async () => {
      transports.getTransport.mockResolvedValue(transportT1);
      const dto: CreateCourierDto = {
        name: 'Ivan',
        transportId: 't1',
        isAvailable: false,
      };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.name).toBe('Ivan');
      expect(result.transportId).toBe('t1');
      expect(result.isAvailable).toBe(false);
      expect(result.transport).toEqual(transportT1);
      expect(transports.getTransport).toHaveBeenCalledWith('t1');
      expect(couriers.saveCourier).toHaveBeenCalledWith({
        id: result.id,
        name: 'Ivan',
        transportId: 't1',
        isAvailable: false,
      });
    });

    it('throws BadRequestException when transportId references missing transport', async () => {
      transports.getTransport.mockResolvedValue(undefined);
      const dto: CreateCourierDto = {
        name: 'Ivan',
        transportId: 'missing-transport',
        isAvailable: true,
      };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Транспорт з ID missing-transport не знайдено',
      );
      expect(couriers.saveCourier).not.toHaveBeenCalled();
    });

    it('defaults isAvailable to true when omitted in dto', async () => {
      const dto: CreateCourierDto = {
        name: 'OnlyName',
      };

      const result = await service.create(dto);

      expect(result.isAvailable).toBe(true);
      expect(couriers.saveCourier).toHaveBeenCalledWith({
        id: result.id,
        name: 'OnlyName',
        transportId: undefined,
        isAvailable: true,
      });
    });

    it('does not resolve transport when transportId is empty string', async () => {
      const dto: CreateCourierDto = {
        name: 'NoTr',
        transportId: '',
      };
      const result = await service.create(dto);
      expect(result.transportId).toBe('');
      expect(result.transport).toBeUndefined();
      expect(transports.getTransport).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('merges dto, validates transport and saves', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'Old',
        transportId: 't0',
        isAvailable: true,
      });
      transports.getTransport.mockImplementation((tid: string) =>
        Promise.resolve(tid === 't1' ? transportT1 : undefined),
      );

      const dto: UpdateCourierDto = {
        name: 'New',
        transportId: 't1',
        isAvailable: false,
      };
      const result = await service.update('c1', dto);

      expect(result.name).toBe('New');
      expect(result.transportId).toBe('t1');
      expect(result.isAvailable).toBe(false);
      expect(result.transport).toEqual(transportT1);
      expect(couriers.saveCourier).toHaveBeenCalledWith({
        id: 'c1',
        name: 'New',
        transportId: 't1',
        isAvailable: false,
      });
    });

    it('throws NotFoundException when courier is missing', async () => {
      couriers.getCourier.mockResolvedValue(undefined);
      await expect(service.update('gone', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(couriers.saveCourier).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when transportId is unknown', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });
      transports.getTransport.mockResolvedValue(undefined);
      await expect(
        service.update('c1', { transportId: 'bad' }),
      ).rejects.toThrow(BadRequestException);
      expect(couriers.saveCourier).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes when no orders reference courier', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });
      couriers.countOrdersForCourier.mockResolvedValue(0);

      await expect(service.remove('c1')).resolves.toBeUndefined();
      expect(couriers.deleteCourier).toHaveBeenCalledWith('c1');
    });

    it('throws NotFoundException when courier is missing', async () => {
      couriers.getCourier.mockResolvedValue(undefined);
      await expect(service.remove('gone')).rejects.toThrow(NotFoundException);
      expect(couriers.countOrdersForCourier).not.toHaveBeenCalled();
    });

    it('throws ConflictException when courier has orders', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });
      couriers.countOrdersForCourier.mockResolvedValue(1);

      await expect(service.remove('c1')).rejects.toThrow(ConflictException);
      await expect(service.remove('c1')).rejects.toThrow(
        "Неможливо видалити кур'єра з ID c1: є пов'язані замовлення",
      );
      expect(couriers.deleteCourier).not.toHaveBeenCalled();
    });
  });
});
