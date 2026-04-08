import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { CategoryEntity } from '../domain/entities';

export abstract class CategoryRepository {
  abstract listCategories(args: ListRepoArgs): Promise<CategoryEntity[]>;
  abstract getCategory(id: string): Promise<CategoryEntity | undefined>;
  abstract saveCategory(entity: CategoryEntity): Promise<void>;
  abstract countProductsInCategory(categoryId: string): Promise<number>;
  abstract deleteCategory(id: string): Promise<void>;
}
