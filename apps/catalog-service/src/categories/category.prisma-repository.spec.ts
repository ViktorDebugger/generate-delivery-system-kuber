import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryPrismaRepository } from './category.prisma-repository';

describe('CategoryPrismaRepository', () => {
  let repository: CategoryPrismaRepository;
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const upsert = jest.fn();
  const deleteCategory = jest.fn();
  const productCount = jest.fn();

  beforeEach(async () => {
    findMany.mockReset();
    findUnique.mockReset();
    upsert.mockReset();
    deleteCategory.mockReset();
    productCount.mockReset();
    findMany.mockResolvedValue([]);
    upsert.mockResolvedValue(undefined);
    deleteCategory.mockResolvedValue(undefined);

    const prisma = {
      category: {
        findMany,
        findUnique,
        upsert,
        delete: deleteCategory,
      },
      product: {
        count: productCount,
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryPrismaRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(CategoryPrismaRepository);
  });

  it('getCategory maps row to entity', async () => {
    findUnique.mockResolvedValue({
      id: 'c1',
      name: 'N',
      description: null,
    });
    const result = await repository.getCategory('c1');
    expect(result).toEqual({ id: 'c1', name: 'N', description: undefined });
  });

  it('getCategory returns undefined when missing', async () => {
    findUnique.mockResolvedValue(null);
    expect(await repository.getCategory('x')).toBeUndefined();
  });

  it('saveCategory upserts', async () => {
    const entity = { id: 'c1', name: 'N', description: 'D' };
    await repository.saveCategory(entity);
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'c1' },
      create: {
        id: 'c1',
        name: 'N',
        description: 'D',
      },
      update: {
        name: 'N',
        description: 'D',
      },
    });
  });

  it('countProductsInCategory delegates to prisma.product.count', async () => {
    productCount.mockResolvedValue(3);
    const n = await repository.countProductsInCategory('c1');
    expect(n).toBe(3);
    expect(productCount).toHaveBeenCalledWith({
      where: { categoryId: 'c1' },
    });
  });

  it('listCategories loads page with order', async () => {
    findMany.mockResolvedValue([
      { id: 'a', name: 'A', description: null },
      { id: 'b', name: 'B', description: 'x' },
    ]);
    const rows = await repository.listCategories({
      skip: 10,
      take: 5,
      sortField: 'name',
      order: 'desc',
    });
    expect(rows).toEqual([
      { id: 'a', name: 'A', description: undefined },
      { id: 'b', name: 'B', description: 'x' },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 5,
      orderBy: { name: 'desc' },
    });
  });

  it('deleteCategory removes row', async () => {
    await repository.deleteCategory('c-del');
    expect(deleteCategory).toHaveBeenCalledWith({
      where: { id: 'c-del' },
    });
  });
});
