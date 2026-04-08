import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ApiListQueryDocs } from './api-list-query.decorator';

export function ApiOrdersListQueryDocs() {
  return applyDecorators(
    ApiListQueryDocs(),
    ApiQuery({ name: 'status', required: false }),
  );
}
