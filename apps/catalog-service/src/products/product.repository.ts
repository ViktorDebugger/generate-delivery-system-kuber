import type { ListRepoArgs } from '../common/list-query/list-query.util';
import type { ProductEntity } from '../domain/entities';

export abstract class ProductRepository {
  abstract listProducts(args: ListRepoArgs): Promise<ProductEntity[]>;
  abstract getProduct(id: string): Promise<ProductEntity | undefined>;
  abstract saveProduct(entity: ProductEntity): Promise<void>;
  abstract countOrderLinksForProduct(productId: string): Promise<number>;
  abstract deleteProduct(id: string): Promise<void>;
}
