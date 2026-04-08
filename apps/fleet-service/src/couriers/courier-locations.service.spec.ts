import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CourierLocationEntity } from '../domain/entities';
import { CourierLocationRepository } from './courier-location.repository';
import { CourierRepository } from './courier.repository';
import { CourierLocationsService } from './courier-locations.service';

describe('CourierLocationsService', () => {
  let service: CourierLocationsService;
  let couriers: jest.Mocked<Pick<CourierRepository, 'getCourier'>>;
  let locations: jest.Mocked<
    Pick<CourierLocationRepository, 'save' | 'findLatestByCourierId'>
  >;

  beforeEach(async () => {
    jest.clearAllMocks();
    couriers = {
      getCourier: jest.fn(),
    };
    locations = {
      save: jest.fn().mockResolvedValue(undefined),
      findLatestByCourierId: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CourierLocationsService,
        { provide: CourierRepository, useValue: couriers },
        { provide: CourierLocationRepository, useValue: locations },
      ],
    }).compile();

    service = moduleRef.get(CourierLocationsService);
  });

  describe('recordLocation', () => {
    it('saves location with optional orderId (fleet does not validate order)', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });

      const result = await service.recordLocation('c1', {
        latitude: 50.45,
        longitude: 30.52,
        orderId: 'o1',
      });

      expect(locations.save).toHaveBeenCalledTimes(1);
      expect(result.courierId).toBe('c1');
      expect(result.orderId).toBe('o1');
      expect(result.latitude).toBe(50.45);
      expect(result.longitude).toBe(30.52);
    });

    it('omits orderId when not provided', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });

      const result = await service.recordLocation('c1', {
        latitude: 1,
        longitude: 2,
      });

      expect(result.orderId).toBeUndefined();
      expect(locations.save).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when courier missing', async () => {
      couriers.getCourier.mockResolvedValue(undefined);
      await expect(
        service.recordLocation('c1', { latitude: 0, longitude: 0 }),
      ).rejects.toThrow(NotFoundException);
      expect(locations.save).not.toHaveBeenCalled();
    });
  });

  describe('getLatestForCourier', () => {
    it('returns latest from repository', async () => {
      const loc: CourierLocationEntity = {
        id: 'l1',
        courierId: 'c1',
        latitude: 10,
        longitude: 20,
        recordedAt: '2026-01-01T00:00:00.000Z',
      };
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });
      locations.findLatestByCourierId.mockResolvedValue(loc);
      await expect(service.getLatestForCourier('c1')).resolves.toEqual(loc);
    });

    it('throws when courier missing', async () => {
      couriers.getCourier.mockResolvedValue(undefined);
      await expect(service.getLatestForCourier('c1')).rejects.toThrow(
        NotFoundException,
      );
      expect(locations.findLatestByCourierId).not.toHaveBeenCalled();
    });

    it('throws when no points yet', async () => {
      couriers.getCourier.mockResolvedValue({
        id: 'c1',
        name: 'A',
        isAvailable: true,
      });
      locations.findLatestByCourierId.mockResolvedValue(undefined);
      await expect(service.getLatestForCourier('c1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
