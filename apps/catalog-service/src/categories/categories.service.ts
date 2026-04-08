import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { buildListRepoArgs } from '../common/list-query/list-query.util';
import {
  buildCategoryCacheKey,
  CATEGORY_BY_ID_CACHE_TTL_MS,
} from './catalog-cache.constants';
import type { CategoryEntity } from '../domain/entities';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './category.repository';

const CATEGORY_SORT_PAIRS = [
  ['id', 'id'],
  ['name', 'name'],
] as const;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoryRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(
    page = 0,
    size = 10,
    sort?: string,
    order?: string,
  ): Promise<CategoryEntity[]> {
    const args = buildListRepoArgs(
      page,
      size,
      sort,
      order,
      CATEGORY_SORT_PAIRS,
      'id',
    );
    return this.categories.listCategories(args);
  }

  async findOne(id: string): Promise<CategoryEntity> {
    return this.cache.wrap(
      buildCategoryCacheKey(id),
      () => this.requireCategoryById(id),
      CATEGORY_BY_ID_CACHE_TTL_MS,
    );
  }

  private async requireCategoryById(id: string): Promise<CategoryEntity> {
    const entity = await this.categories.getCategory(id);
    if (!entity) {
      throw new NotFoundException(`Категорія з ID ${id} не знайдена`);
    }
    return entity;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const entity: CategoryEntity = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
    };
    await this.persistCategory(entity);
    return entity;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const existing = await this.categories.getCategory(id);
    if (!existing) {
      throw new NotFoundException(`Категорія з ID ${id} не знайдена`);
    }
    const entity: CategoryEntity = {
      id,
      name: dto.name ?? existing.name,
      description:
        dto.description !== undefined ? dto.description : existing.description,
    };
    await this.persistCategory(entity);
    return entity;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.categories.getCategory(id);
    if (!existing) {
      throw new NotFoundException(`Категорія з ID ${id} не знайдена`);
    }
    const productCount = await this.categories.countProductsInCategory(id);
    if (productCount > 0) {
      throw new ConflictException(
        `Неможливо видалити категорію з ID ${id}: є пов'язані товари`,
      );
    }
    await this.categories.deleteCategory(id);
    await this.invalidateCategoryByIdCache(id);
  }

  private async persistCategory(entity: CategoryEntity): Promise<void> {
    await this.categories.saveCategory(entity);
    await this.invalidateCategoryByIdCache(entity.id);
  }

  private async invalidateCategoryByIdCache(id: string): Promise<void> {
    await this.cache.del(buildCategoryCacheKey(id));
  }
}
