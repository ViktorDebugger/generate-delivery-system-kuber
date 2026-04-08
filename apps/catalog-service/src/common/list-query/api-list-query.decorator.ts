import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiListQueryDocs() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Номер сторінки з 0',
      schema: { default: 0, minimum: 0 },
    }),
    ApiQuery({
      name: 'size',
      required: false,
      description: 'Розмір сторінки (максимум 100)',
      schema: { default: 10, minimum: 1, maximum: 100 },
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      description: 'Поле сортування (whitelist залежно від ресурсу)',
      schema: { default: 'id' },
    }),
    ApiQuery({
      name: 'order',
      required: false,
      description: 'Напрям сортування',
      schema: { default: 'asc', enum: ['asc', 'desc'] },
    }),
  );
}
