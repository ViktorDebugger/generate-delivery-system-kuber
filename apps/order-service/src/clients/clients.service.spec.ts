import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import type { ClientEntity } from '../domain/entities';
import { ClientRepository } from './client.repository';
import { ClientsService } from './clients.service';
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

describe('ClientsService', () => {
  let service: ClientsService;
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

  beforeEach(async () => {
    jest.clearAllMocks();
    clients = {
      listClients: jest.fn(),
      getClient: jest.fn(),
      saveClient: jest.fn().mockResolvedValue(undefined),
      countOrdersForClient: jest.fn(),
      deleteClient: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: ClientRepository, useValue: clients },
      ],
    }).compile();

    service = moduleRef.get(ClientsService);
  });

  describe('findAll', () => {
    it('returns list from repository', async () => {
      const list: ClientEntity[] = [
        {
          id: 'a',
          fullName: 'A',
          email: 'a@a.com',
        },
      ];
      clients.listClients.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toEqual(list);
      expect(clients.listClients).toHaveBeenCalledWith(
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
    it('returns client when repository has it', async () => {
      const entity: ClientEntity = {
        id: 'x',
        fullName: 'X',
        email: 'x@x.com',
      };
      clients.getClient.mockResolvedValue(entity);
      await expect(service.findOne('x')).resolves.toEqual(entity);
      expect(clients.getClient).toHaveBeenCalledWith('x');
    });

    it('throws NotFoundException when client is missing', async () => {
      clients.getClient.mockResolvedValue(undefined);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing')).rejects.toThrow(
        'Клієнт з ID missing не знайдено',
      );
    });
  });

  describe('create', () => {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('generates id, saves and returns entity with dto fields', async () => {
      const dto: CreateClientDto = {
        fullName: 'Ivan',
        email: 'ivan@test.com',
        address: 'Lviv',
      };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.fullName).toBe('Ivan');
      expect(result.email).toBe('ivan@test.com');
      expect(result.address).toBe('Lviv');
      expect(clients.saveClient).toHaveBeenCalledTimes(1);
      expect(clients.saveClient).toHaveBeenCalledWith({
        id: result.id,
        fullName: 'Ivan',
        email: 'ivan@test.com',
        address: 'Lviv',
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('omits address when not provided in dto', async () => {
      const dto: CreateClientDto = {
        fullName: 'NoAddr',
        email: 'n@n.com',
      };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.address).toBeUndefined();
      expect(clients.saveClient).toHaveBeenCalledWith({
        id: result.id,
        fullName: 'NoAddr',
        email: 'n@n.com',
        address: undefined,
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('throws ConflictException on unique email violation', async () => {
      clients.saveClient.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique', {
          code: 'P2002',
          clientVersion: '0',
        }),
      );
      await expect(
        service.create({
          fullName: 'A',
          email: 'dup@x.com',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({
          fullName: 'A',
          email: 'dup@x.com',
        }),
      ).rejects.toThrow('Клієнт з таким email вже існує');
    });
  });

  describe('update', () => {
    it('merges dto into existing client and saves', async () => {
      clients.getClient.mockResolvedValue({
        id: 'id-1',
        fullName: 'Old',
        email: 'old@x.com',
        address: 'A',
      });
      const dto: UpdateClientDto = { fullName: 'New' };

      const result = await service.update('id-1', dto);

      expect(result).toEqual({
        id: 'id-1',
        fullName: 'New',
        email: 'old@x.com',
        address: 'A',
      });
      expect(clients.saveClient).toHaveBeenCalledWith({
        id: 'id-1',
        fullName: 'New',
        email: 'old@x.com',
        address: 'A',
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('throws NotFoundException when client is missing', async () => {
      clients.getClient.mockResolvedValue(undefined);
      await expect(service.update('gone', { fullName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(clients.saveClient).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate email', async () => {
      clients.getClient.mockResolvedValue({
        id: 'id-1',
        fullName: 'A',
        email: 'a@x.com',
      });
      clients.saveClient.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique', {
          code: 'P2002',
          clientVersion: '0',
        }),
      );
      await expect(
        service.update('id-1', { email: 'taken@x.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes when no orders reference client', async () => {
      clients.getClient.mockResolvedValue({
        id: 'c1',
        fullName: 'A',
        email: 'a@a.com',
      });
      clients.countOrdersForClient.mockResolvedValue(0);

      await expect(service.remove('c1')).resolves.toBeUndefined();
      expect(clients.countOrdersForClient).toHaveBeenCalledWith('c1');
      expect(clients.deleteClient).toHaveBeenCalledWith('c1');
    });

    it('throws NotFoundException when client is missing', async () => {
      clients.getClient.mockResolvedValue(undefined);
      await expect(service.remove('gone')).rejects.toThrow(NotFoundException);
      expect(clients.countOrdersForClient).not.toHaveBeenCalled();
      expect(clients.deleteClient).not.toHaveBeenCalled();
    });

    it('throws ConflictException when client has orders', async () => {
      clients.getClient.mockResolvedValue({
        id: 'c1',
        fullName: 'A',
        email: 'a@a.com',
      });
      clients.countOrdersForClient.mockResolvedValue(2);

      await expect(service.remove('c1')).rejects.toThrow(ConflictException);
      await expect(service.remove('c1')).rejects.toThrow(
        "Неможливо видалити клієнта з ID c1: є пов'язані замовлення",
      );
      expect(clients.deleteClient).not.toHaveBeenCalled();
    });
  });
});
