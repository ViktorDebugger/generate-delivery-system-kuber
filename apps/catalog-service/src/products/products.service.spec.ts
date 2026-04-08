import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryRepository } from '../categories/category.repository';
import type {
  CategoryEntity,
  ProductEntity,
  ProductResponse,
} from '../domain/entities';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './product.repository';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let products: jest.Mocked<
    Pick<
      ProductRepository,
      | 'listProducts'
      | 'getProduct'
      | 'saveProduct'
      | 'countOrderLinksForProduct'
      | 'deleteProduct'
    >
  >;
  let categories: jest.Mocked<Pick<CategoryRepository, 'getCategory'>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    products = {
      listProducts: jest.fn(),
      getProduct: jest.fn(),
      saveProduct: jest.fn().mockResolvedValue(undefined),
      countOrderLinksForProduct: jest.fn(),
      deleteProduct: jest.fn().mockResolvedValue(undefined),
    };
    categories = {
      getCategory: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductRepository, useValue: products },
        { provide: CategoryRepository, useValue: categories },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  const uuidV4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  describe('findAll', () => {
    it('maps products and embeds category when present in storage', async () => {
      const category: CategoryEntity = {
        id: 'cat-1',
        name: 'Electronics',
      };
      const p1: ProductEntity = {
        id: 'p1',
        name: 'Phone',
        price: 100,
        categoryId: 'cat-1',
      };
      const p2: ProductEntity = {
        id: 'p2',
        name: 'Free',
        price: 1,
      };
      products.listProducts.mockResolvedValue([p1, p2]);
      categories.getCategory.mockImplementation((id: string) =>
        Promise.resolve(id === 'cat-1' ? category : undefined),
      );

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(products.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          sortField: 'id',
          order: 'asc',
        }),
      );
      expect(result[0]).toEqual({
        ...p1,
        category,
      } satisfies ProductResponse);
      expect(result[1]).toEqual({
        ...p2,
      } satisfies ProductResponse);
      expect(result[1].category).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('returns product with embedded category when category exists', async () => {
      const category: CategoryEntity = {
        id: 'cat-x',
        name: 'Books',
      };
      const entity: ProductEntity = {
        id: 'px',
        name: 'Novel',
        price: 20,
        categoryId: 'cat-x',
      };
      products.getProduct.mockResolvedValue(entity);
      categories.getCategory.mockResolvedValue(category);

      const result = await service.findOne('px');

      expect(result).toEqual({
        ...entity,
        category,
      } satisfies ProductResponse);
    });

    it('returns product without category when categoryId is missing', async () => {
      const entity: ProductEntity = {
        id: 'py',
        name: 'Loose',
        price: 5,
      };
      products.getProduct.mockResolvedValue(entity);

      const result = await service.findOne('py');

      expect(result).toEqual({ ...entity });
      expect(result.category).toBeUndefined();
      expect(categories.getCategory).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when product is missing', async () => {
      products.getProduct.mockResolvedValue(undefined);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing')).rejects.toThrow(
        'Товар з ID missing не знайдено',
      );
    });
  });

  describe('create', () => {
    it('saves and returns product without categoryId', async () => {
      const dto: CreateProductDto = { name: 'Mug', price: 9 };

      const result = await service.create(dto);

      expect(result.id).toMatch(uuidV4);
      expect(result.name).toBe('Mug');
      expect(result.price).toBe(9);
      expect(result.categoryId).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(categories.getCategory).not.toHaveBeenCalled();
      expect(products.saveProduct).toHaveBeenCalledWith({
        id: result.id,
        name: 'Mug',
        price: 9,
        categoryId: undefined,
      });
    });

    it('throws BadRequestException when categoryId is unknown', async () => {
      categories.getCategory.mockResolvedValue(undefined);
      const dto: CreateProductDto = {
        name: 'X',
        price: 1,
        categoryId: 'unknown-cat',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Категорія з ID unknown-cat не знайдена',
      );
      expect(products.saveProduct).not.toHaveBeenCalled();
    });

    it('saves with categoryId and embeds category in response when valid', async () => {
      const category: CategoryEntity = {
        id: 'cat-ok',
        name: 'OK',
      };
      categories.getCategory.mockResolvedValue(category);
      const dto: CreateProductDto = {
        name: 'Linked',
        price: 3,
        categoryId: 'cat-ok',
      };

      const result = await service.create(dto);

      expect(result.category).toEqual(category);
      expect(products.saveProduct).toHaveBeenCalledWith({
        id: result.id,
        name: 'Linked',
        price: 3,
        categoryId: 'cat-ok',
      });
    });

    it('does not validate category when categoryId is empty string', async () => {
      const dto: CreateProductDto = {
        name: 'E',
        price: 1,
        categoryId: '',
      };

      const result = await service.create(dto);

      expect(categories.getCategory).not.toHaveBeenCalled();
      expect(result.categoryId).toBe('');
      expect(result.category).toBeUndefined();
    });
  });

  describe('update', () => {
    it('merges dto and validates category when categoryId set', async () => {
      products.getProduct.mockResolvedValue({
        id: 'p1',
        name: 'Old',
        price: 10,
        categoryId: 'c-old',
      });
      const category: CategoryEntity = { id: 'c-new', name: 'NewCat' };
      categories.getCategory.mockImplementation((id: string) =>
        Promise.resolve(id === 'c-new' ? category : undefined),
      );

      const dto: UpdateProductDto = {
        name: 'New',
        price: 20,
        categoryId: 'c-new',
      };
      const result = await service.update('p1', dto);

      expect(result.name).toBe('New');
      expect(result.price).toBe(20);
      expect(result.categoryId).toBe('c-new');
      expect(result.category).toEqual(category);
      expect(products.saveProduct).toHaveBeenCalledWith({
        id: 'p1',
        name: 'New',
        price: 20,
        categoryId: 'c-new',
      });
    });

    it('throws NotFoundException when product is missing', async () => {
      products.getProduct.mockResolvedValue(undefined);
      await expect(service.update('gone', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(products.saveProduct).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when new categoryId is unknown', async () => {
      products.getProduct.mockResolvedValue({
        id: 'p1',
        name: 'A',
        price: 1,
      });
      categories.getCategory.mockResolvedValue(undefined);
      await expect(service.update('p1', { categoryId: 'bad' })).rejects.toThrow(
        BadRequestException,
      );
      expect(products.saveProduct).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes when product is not in any order', async () => {
      products.getProduct.mockResolvedValue({
        id: 'p1',
        name: 'X',
        price: 1,
      });
      products.countOrderLinksForProduct.mockResolvedValue(0);

      await expect(service.remove('p1')).resolves.toBeUndefined();
      expect(products.deleteProduct).toHaveBeenCalledWith('p1');
    });

    it('throws NotFoundException when product is missing', async () => {
      products.getProduct.mockResolvedValue(undefined);
      await expect(service.remove('gone')).rejects.toThrow(NotFoundException);
      expect(products.countOrderLinksForProduct).not.toHaveBeenCalled();
    });

    it('throws ConflictException when product is linked to orders', async () => {
      products.getProduct.mockResolvedValue({
        id: 'p1',
        name: 'X',
        price: 1,
      });
      products.countOrderLinksForProduct.mockResolvedValue(2);

      await expect(service.remove('p1')).rejects.toThrow(ConflictException);
      await expect(service.remove('p1')).rejects.toThrow(
        'Неможливо видалити товар з ID p1: він є в замовленнях',
      );
      expect(products.deleteProduct).not.toHaveBeenCalled();
    });
  });
});
