import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { TransportEntity } from '../domain/entities';
import type { CreateTransportDto } from './dto/create-transport.dto';
import type { UpdateTransportDto } from './dto/update-transport.dto';
import { TransportRepository } from './transport.repository';
import { TransportsService } from './transports.service';

describe('TransportsService', () => {
  let service: TransportsService;
  let transports: jest.Mocked<
    Pick<
      TransportRepository,
      | 'listTransports'
      | 'getTransport'
      | 'saveTransport'
      | 'countCouriersForTransport'
      | 'deleteTransport'
    >
  >;

  beforeEach(async () => {
    jest.clearAllMocks();
    transports = {
      listTransports: jest.fn(),
      getTransport: jest.fn(),
      saveTransport: jest.fn().mockResolvedValue(undefined),
      countCouriersForTransport: jest.fn(),
      deleteTransport: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TransportsService,
        { provide: TransportRepository, useValue: transports },
      ],
    }).compile();

    service = moduleRef.get(TransportsService);
  });

  describe('findAll', () => {
    it('returns list from repository', async () => {
      const list: TransportEntity[] = [
        {
          id: 'a',
          name: 'Van',
        },
      ];
      transports.listTransports.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toEqual(list);
      expect(transports.listTransports).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          sortField: 'id',
          order: 'asc',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns transport when repository has it', async () => {
      const entity: TransportEntity = {
        id: 'x',
        name: 'Truck',
        description: 'Heavy',
      };
      transports.getTransport.mockResolvedValue(entity);
      await expect(service.findOne('x')).resolves.toEqual(entity);
      expect(transports.getTransport).toHaveBeenCalledWith('x');
    });

    it('throws NotFoundException when transport is missing', async () => {
      transports.getTransport.mockResolvedValue(undefined);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing')).rejects.toThrow(
        'Транспорт з ID missing не знайдено',
      );
    });
  });

  describe('create', () => {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('generates id, saves and returns entity with dto fields', async () => {
      const dto: CreateTransportDto = {
        name: 'Bike',
        description: 'City',
      };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.name).toBe('Bike');
      expect(result.description).toBe('City');
      expect(transports.saveTransport).toHaveBeenCalledTimes(1);
      expect(transports.saveTransport).toHaveBeenCalledWith({
        id: result.id,
        name: 'Bike',
        description: 'City',
      });
    });

    it('omits description when not provided in dto', async () => {
      const dto: CreateTransportDto = {
        name: 'Scooter',
      };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.description).toBeUndefined();
      expect(transports.saveTransport).toHaveBeenCalledWith({
        id: result.id,
        name: 'Scooter',
        description: undefined,
      });
    });
  });

  describe('update', () => {
    it('merges dto into existing transport and saves', async () => {
      transports.getTransport.mockResolvedValue({
        id: 't1',
        name: 'Old',
        description: 'D',
      });
      const dto: UpdateTransportDto = { name: 'New' };

      const result = await service.update('t1', dto);

      expect(result).toEqual({
        id: 't1',
        name: 'New',
        description: 'D',
      });
      expect(transports.saveTransport).toHaveBeenCalledWith({
        id: 't1',
        name: 'New',
        description: 'D',
      });
    });

    it('throws NotFoundException when transport is missing', async () => {
      transports.getTransport.mockResolvedValue(undefined);
      await expect(service.update('gone', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(transports.saveTransport).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes when no couriers use transport', async () => {
      transports.getTransport.mockResolvedValue({
        id: 't1',
        name: 'X',
      });
      transports.countCouriersForTransport.mockResolvedValue(0);

      await expect(service.remove('t1')).resolves.toBeUndefined();
      expect(transports.countCouriersForTransport).toHaveBeenCalledWith('t1');
      expect(transports.deleteTransport).toHaveBeenCalledWith('t1');
    });

    it('throws NotFoundException when transport is missing', async () => {
      transports.getTransport.mockResolvedValue(undefined);
      await expect(service.remove('gone')).rejects.toThrow(NotFoundException);
      expect(transports.countCouriersForTransport).not.toHaveBeenCalled();
    });

    it('throws ConflictException when couriers reference transport', async () => {
      transports.getTransport.mockResolvedValue({
        id: 't1',
        name: 'X',
      });
      transports.countCouriersForTransport.mockResolvedValue(1);

      await expect(service.remove('t1')).rejects.toThrow(ConflictException);
      await expect(service.remove('t1')).rejects.toThrow(
        "Неможливо видалити транспорт з ID t1: є пов'язані кур'єри",
      );
      expect(transports.deleteTransport).not.toHaveBeenCalled();
    });
  });
});
