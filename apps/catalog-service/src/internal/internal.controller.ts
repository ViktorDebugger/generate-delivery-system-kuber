import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CategoriesService } from '../categories/categories.service';
import { ProductsService } from '../products/products.service';
import { InternalApiGuard } from './internal-api.guard';

@ApiTags('internal')
@ApiSecurity('internal-api-key')
@ApiUnauthorizedResponse({
  description: 'Невірний або відсутній ключ (коли INTERNAL_API_KEY задано)',
})
@UseGuards(InternalApiGuard)
@Controller('internal')
export class InternalController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get('products/:id')
  @ApiOperation({ summary: 'Міжсервісна перевірка існування товару' })
  @ApiParam({ name: 'id', description: 'UUID товару' })
  @ApiResponse({ status: 200, description: 'Товар знайдено' })
  @ApiResponse({ status: 404, description: 'Товар не знайдено' })
  getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Міжсервісна перевірка існування категорії' })
  @ApiParam({ name: 'id', description: 'UUID категорії' })
  @ApiResponse({ status: 200, description: 'Категорія знайдена' })
  @ApiResponse({ status: 404, description: 'Категорія не знайдена' })
  getCategory(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }
}
