export interface CategoryEntity {
  id: string;
  name: string;
  description?: string;
}

export interface ProductEntity {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
}

export type ProductResponse = ProductEntity & {
  category?: CategoryEntity;
};
