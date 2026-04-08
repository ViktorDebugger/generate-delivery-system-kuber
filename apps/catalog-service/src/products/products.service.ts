import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CategoryRepository } from '../categories/category.repository';
import { buildListRepoArgs } from '../common/list-query/list-query.util';
import type { ProductEntity, ProductResponse } from '../domain/entities';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './product.repository';

const PRODUCT_SORT_PAIRS = [
  ['id', 'id'],
  ['name', 'name'],
  ['price', 'price'],
  ['categoryid', 'categoryId'],
] as const;

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async findAll(
    page = 0,
    size = 10,
    sort?: string,
    order?: string,
  ): Promise<ProductResponse[]> {
    const args = buildListRepoArgs(
      page,
      size,
      sort,
      order,
      PRODUCT_SORT_PAIRS,
      'id',
    );
    const list = await this.products.listProducts(args);
    return Promise.all(list.map((p) => this.toResponse(p)));
  }

  async findOne(id: string): Promise<ProductResponse> {
    const entity = await this.products.getProduct(id);
    if (!entity) {
      throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    }
    return this.toResponse(entity);
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    await this.assertCategoryExistsIfSet(dto.categoryId);
    const entity: ProductEntity = {
      id: randomUUID(),
      name: dto.name,
      price: dto.price,
      categoryId: dto.categoryId,
    };
    await this.products.saveProduct(entity);
    return this.toResponse(entity);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const existing = await this.products.getProduct(id);
    if (!existing) {
      throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    }
    const categoryId =
      dto.categoryId !== undefined ? dto.categoryId : existing.categoryId;
    await this.assertCategoryExistsIfSet(categoryId);
    const entity: ProductEntity = {
      id,
      name: dto.name ?? existing.name,
      price: dto.price ?? existing.price,
      categoryId,
    };
    await this.products.saveProduct(entity);
    return this.toResponse(entity);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.products.getProduct(id);
    if (!existing) {
      throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    }
    const links = await this.products.countOrderLinksForProduct(id);
    if (links > 0) {
      throw new ConflictException(
        `Неможливо видалити товар з ID ${id}: він є в замовленнях`,
      );
    }
    await this.products.deleteProduct(id);
  }

  private async assertCategoryExistsIfSet(
    categoryId: string | undefined,
  ): Promise<void> {
    if (categoryId !== undefined && categoryId !== '') {
      const cat = await this.categories.getCategory(categoryId);
      if (!cat) {
        throw new BadRequestException(
          `Категорія з ID ${categoryId} не знайдена`,
        );
      }
    }
  }

  private async toResponse(entity: ProductEntity): Promise<ProductResponse> {
    const category =
      entity.categoryId !== undefined && entity.categoryId !== ''
        ? await this.categories.getCategory(entity.categoryId)
        : undefined;
    const out: ProductResponse = { ...entity };
    if (category !== undefined) {
      out.category = category;
    }
    return out;
  }
}
