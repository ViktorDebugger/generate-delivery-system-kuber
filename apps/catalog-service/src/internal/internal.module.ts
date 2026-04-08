import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { InternalApiGuard } from './internal-api.guard';
import { InternalController } from './internal.controller';

@Module({
  imports: [CategoriesModule, ProductsModule],
  controllers: [InternalController],
  providers: [InternalApiGuard],
})
export class InternalModule {}
