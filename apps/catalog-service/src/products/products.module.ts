import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ProductPrismaRepository } from './product.prisma-repository';
import { ProductRepository } from './product.repository';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [CategoriesModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    { provide: ProductRepository, useClass: ProductPrismaRepository },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
