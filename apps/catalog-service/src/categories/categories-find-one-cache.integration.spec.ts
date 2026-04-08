import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { ErrorResponseFilter } from '../common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../common/validation/global-validation.pipe';
import type { CategoryEntity } from '../domain/entities';
import { CATEGORY_BY_ID_CACHE_TTL_MS } from './catalog-cache.constants';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from './category.repository';

type CategoryBody = {
  id: string;
  name: string;
  description?: string;
};

describe('Categories GET :id cache (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let getCategoryMock: jest.Mock<Promise<CategoryEntity | undefined>, [string]>;

  beforeEach(async () => {
    const store = new Map<string, CategoryEntity>();
    getCategoryMock = jest.fn((id: string) => Promise.resolve(store.get(id)));

    const mockRepo: CategoryRepository = {
      listCategories: jest.fn().mockResolvedValue([]),
      getCategory: getCategoryMock,
      saveCategory: jest.fn((entity: CategoryEntity) => {
        store.set(entity.id, { ...entity });
        return Promise.resolve();
      }),
      countProductsInCategory: jest.fn().mockResolvedValue(0),
      deleteCategory: jest.fn((id: string) => {
        store.delete(id);
        return Promise.resolve();
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: CATEGORY_BY_ID_CACHE_TTL_MS })],
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        { provide: CategoryRepository, useValue: mockRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(new ErrorResponseFilter());
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('second GET /api/categories/:id does not call repository getCategory again', async () => {
    const post = await request(httpServer)
      .post('/api/categories')
      .send({ name: 'CacheInt', description: 'ci' })
      .expect(201);
    const created = post.body as CategoryBody;
    getCategoryMock.mockClear();

    const first = await request(httpServer)
      .get(`/api/categories/${created.id}`)
      .expect(200);
    expect((first.body as CategoryBody).name).toBe('CacheInt');

    const second = await request(httpServer)
      .get(`/api/categories/${created.id}`)
      .expect(200);
    expect((second.body as CategoryBody).name).toBe('CacheInt');

    expect(getCategoryMock).toHaveBeenCalledTimes(1);
    expect(getCategoryMock).toHaveBeenCalledWith(created.id);
  });
});
