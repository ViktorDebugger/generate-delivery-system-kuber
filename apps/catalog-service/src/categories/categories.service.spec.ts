import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Cache } from 'cache-manager';
import type { CategoryEntity } from '../domain/entities';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import {
  buildCategoryCacheKey,
  CATEGORY_BY_ID_CACHE_TTL_MS,
} from './catalog-cache.constants';
import { CategoryRepository } from './category.repository';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let cache: {
    get: jest.MockedFunction<Cache['get']>;
    set: jest.MockedFunction<Cache['set']>;
    del: jest.MockedFunction<Cache['del']>;
    wrap: jest.Mock;
  };
  let categories: jest.Mocked<
    Pick<
      CategoryRepository,
      | 'listCategories'
      | 'getCategory'
      | 'saveCategory'
      | 'countProductsInCategory'
      | 'deleteCategory'
    >
  >;

  beforeEach(async () => {
    jest.clearAllMocks();
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(true),
      wrap: jest.fn(
        async (
          key: string,
          fn: () => Promise<unknown>,
          ttl?: number,
        ): Promise<unknown> => {
          const hit = await cache.get(key);
          if (hit !== undefined) {
            return hit;
          }
          const result = await fn();
          await cache.set(key, result, ttl);
          return result;
        },
      ),
    };
    categories = {
      listCategories: jest.fn(),
      getCategory: jest.fn(),
      saveCategory: jest.fn().mockResolvedValue(undefined),
      countProductsInCategory: jest.fn(),
      deleteCategory: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoryRepository, useValue: categories },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  describe('findAll', () => {
    it('returns list from repository', async () => {
      const list: CategoryEntity[] = [{ id: 'a', name: 'Books' }];
      categories.listCategories.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toEqual(list);
      expect(categories.listCategories).toHaveBeenCalledWith(
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
    it('returns category when repository has it', async () => {
      const entity: CategoryEntity = {
        id: 'x',
        name: 'X',
        description: 'D',
      };
      categories.getCategory.mockResolvedValue(entity);
      await expect(service.findOne('x')).resolves.toEqual(entity);
      expect(categories.getCategory).toHaveBeenCalledWith('x');
      expect(cache.wrap).toHaveBeenCalledWith(
        buildCategoryCacheKey('x'),
        expect.any(Function),
        CATEGORY_BY_ID_CACHE_TTL_MS,
      );
      expect(cache.set).toHaveBeenCalledWith(
        buildCategoryCacheKey('x'),
        entity,
        CATEGORY_BY_ID_CACHE_TTL_MS,
      );
    });

    it('returns cached category without hitting repository', async () => {
      const entity: CategoryEntity = {
        id: 'x',
        name: 'X',
        description: 'D',
      };
      cache.get.mockResolvedValue(entity);
      await expect(service.findOne('x')).resolves.toEqual(entity);
      expect(categories.getCategory).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(cache.wrap).toHaveBeenCalledWith(
        buildCategoryCacheKey('x'),
        expect.any(Function),
        CATEGORY_BY_ID_CACHE_TTL_MS,
      );
    });

    it('throws NotFoundException when category is missing', async () => {
      categories.getCategory.mockResolvedValue(undefined);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing')).rejects.toThrow(
        'Категорія з ID missing не знайдена',
      );
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('generates id, saves and returns entity with dto fields', async () => {
      const dto: CreateCategoryDto = {
        name: 'Electronics',
        description: 'Gadgets',
      };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.name).toBe('Electronics');
      expect(result.description).toBe('Gadgets');
      expect(categories.saveCategory).toHaveBeenCalledWith({
        id: result.id,
        name: 'Electronics',
        description: 'Gadgets',
      });
      expect(cache.del).toHaveBeenCalledWith(buildCategoryCacheKey(result.id));
    });

    it('omits description when not provided in dto', async () => {
      const dto: CreateCategoryDto = { name: 'Food' };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.description).toBeUndefined();
      expect(categories.saveCategory).toHaveBeenCalledWith({
        id: result.id,
        name: 'Food',
        description: undefined,
      });
      expect(cache.del).toHaveBeenCalledWith(buildCategoryCacheKey(result.id));
    });
  });

  describe('update', () => {
    it('merges dto into existing category and saves', async () => {
      categories.getCategory.mockResolvedValue({
        id: 'c1',
        name: 'Old',
        description: 'Desc',
      });
      const dto: UpdateCategoryDto = { name: 'New' };

      const result = await service.update('c1', dto);

      expect(result).toEqual({
        id: 'c1',
        name: 'New',
        description: 'Desc',
      });
      expect(categories.saveCategory).toHaveBeenCalledWith({
        id: 'c1',
        name: 'New',
        description: 'Desc',
      });
      expect(cache.del).toHaveBeenCalledWith(buildCategoryCacheKey('c1'));
    });

    it('throws NotFoundException when category is missing', async () => {
      categories.getCategory.mockResolvedValue(undefined);
      await expect(service.update('gone', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(categories.saveCategory).not.toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes when no products reference category', async () => {
      categories.getCategory.mockResolvedValue({
        id: 'c1',
        name: 'X',
      });
      categories.countProductsInCategory.mockResolvedValue(0);

      await expect(service.remove('c1')).resolves.toBeUndefined();
      expect(categories.countProductsInCategory).toHaveBeenCalledWith('c1');
      expect(categories.deleteCategory).toHaveBeenCalledWith('c1');
      expect(cache.del).toHaveBeenCalledWith(buildCategoryCacheKey('c1'));
    });

    it('throws NotFoundException when category is missing', async () => {
      categories.getCategory.mockResolvedValue(undefined);
      await expect(service.remove('gone')).rejects.toThrow(NotFoundException);
      expect(categories.countProductsInCategory).not.toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
    });

    it('throws ConflictException when category has products', async () => {
      categories.getCategory.mockResolvedValue({
        id: 'c1',
        name: 'X',
      });
      categories.countProductsInCategory.mockResolvedValue(3);

      await expect(service.remove('c1')).rejects.toThrow(ConflictException);
      await expect(service.remove('c1')).rejects.toThrow(
        "Неможливо видалити категорію з ID c1: є пов'язані товари",
      );
      expect(categories.deleteCategory).not.toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
    });
  });
});
