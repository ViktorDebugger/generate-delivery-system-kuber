import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';

type CategoryBody = {
  id: string;
  name: string;
};

type ProductBody = {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  category?: CategoryBody;
};

describe('Products HTTP (e2e)', () => {
  let app: INestApplication | undefined;
  let httpServer: Server | undefined;

  const raw = () => request(httpServer!);

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

  it('POST /api/products then GET list and GET /api/products/:id', async () => {
    const post = await raw()
      .post('/api/products')
      .send({ name: 'Mug', price: 12 })
      .expect(201);
    const created = post.body as ProductBody;

    const listRes = await raw()
      .get('/api/products?page=0&size=100')
      .expect(200);
    const list = listRes.body as ProductBody[];
    expect(Array.isArray(list)).toBe(true);

    const one = await raw().get(`/api/products/${created.id}`).expect(200);
    expect((one.body as ProductBody).name).toBe('Mug');

    await raw().delete(`/api/products/${created.id}`).expect(204);
  });

  it('PUT /api/products/:id then GET', async () => {
    const post = await raw()
      .post('/api/products')
      .send({ name: 'Before', price: 5 })
      .expect(201);
    const p = post.body as ProductBody;

    await raw()
      .put(`/api/products/${p.id}`)
      .send({ name: 'After', price: 99 })
      .expect(200);

    const one = await raw().get(`/api/products/${p.id}`).expect(200);
    const body = one.body as ProductBody;
    expect(body.name).toBe('After');
    expect(body.price).toBe(99);

    await raw().delete(`/api/products/${p.id}`).expect(204);
  });

  it('DELETE /api/products/:id when not linked to orders', async () => {
    const post = await raw()
      .post('/api/products')
      .send({ name: 'ToDelete', price: 1 })
      .expect(201);
    const p = post.body as ProductBody;

    await raw().delete(`/api/products/${p.id}`).expect(204);

    await raw().get(`/api/products/${p.id}`).expect(404);
  });

  it('POST /api/products with categoryId then GET embeds category', async () => {
    const catRes = await raw()
      .post('/api/categories')
      .send({ name: 'Food' })
      .expect(201);
    const cat = catRes.body as CategoryBody;

    const pRes = await raw()
      .post('/api/products')
      .send({ name: 'Apple', price: 3, categoryId: cat.id })
      .expect(201);
    const product = pRes.body as ProductBody;
    expect(product.categoryId).toBe(cat.id);
    expect(product.category?.id).toBe(cat.id);

    const getOne = await raw().get(`/api/products/${product.id}`).expect(200);
    const body = getOne.body as ProductBody;
    expect(body.name).toBe('Apple');
    expect(body.category?.id).toBe(cat.id);
    expect(body.category?.name).toBe('Food');

    await raw().delete(`/api/products/${product.id}`).expect(204);
    await raw().delete(`/api/categories/${cat.id}`).expect(204);
  });
});
