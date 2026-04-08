import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';

type CategoryCreateResponse = {
  id: string;
  name: string;
  description?: string;
};

type ProductCreateResponse = {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  category?: { id: string; name: string };
};

describe('Catalog HTTP (e2e)', () => {
  let app: INestApplication | undefined;
  let httpServer: Server | undefined;

  beforeAll(async () => {
    if (
      process.env.DATABASE_URL === undefined ||
      process.env.DATABASE_URL === ''
    ) {
      throw new Error('E2E requires DATABASE_URL (see .env.example)');
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(new ErrorResponseFilter());
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates a category then a product linked to it', async () => {
    const catRes = await request(httpServer!)
      .post('/api/categories')
      .send({ name: `E2E Cat ${Date.now()}`, description: 'x' })
      .expect(201);

    const catBody = catRes.body as CategoryCreateResponse;
    const categoryId = catBody.id;

    const prodRes = await request(httpServer!)
      .post('/api/products')
      .send({
        name: `E2E Product ${Date.now()}`,
        price: 42.5,
        categoryId,
      })
      .expect(201);

    const prodBody = prodRes.body as ProductCreateResponse;
    expect(prodBody.name.includes('E2E Product')).toBe(true);
    expect(prodBody.price).toBe(42.5);
    expect(prodBody.categoryId).toBe(categoryId);
    expect(prodBody.category).toMatchObject({
      id: categoryId,
    });

    await request(httpServer!)
      .delete(`/api/products/${prodBody.id}`)
      .expect(204);
    await request(httpServer!)
      .delete(`/api/categories/${categoryId}`)
      .expect(204);
  });
});
