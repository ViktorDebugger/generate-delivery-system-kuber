import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';

type CategoryBody = {
  id: string;
  name: string;
  description?: string;
};

type ErrorResponseBody = {
  timestamp: string;
  status: number;
  message: string;
  path: string;
};

describe('Categories HTTP (e2e)', () => {
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

  it('POST /api/categories then GET list and GET /api/categories/:id', async () => {
    const post = await raw()
      .post('/api/categories')
      .send({ name: 'Books', description: 'Paper' })
      .expect(201);
    const created = post.body as CategoryBody;

    const listRes = await raw()
      .get('/api/categories?page=0&size=100')
      .expect(200);
    const list = listRes.body as CategoryBody[];
    expect(Array.isArray(list)).toBe(true);

    const one = await raw()
      .get(`/api/categories/${created.id}`)
      .expect(200);
    expect((one.body as CategoryBody).name).toBe('Books');

    await raw().delete(`/api/categories/${created.id}`).expect(204);
  });

  it('GET /api/categories page 0 and 1 do not overlap; desc name order', async () => {
    const tag = randomUUID();
    const createdIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await raw()
        .post('/api/categories')
        .send({
          name: `zzsuite-${tag}-${String(i).padStart(2, '0')}`,
          description: 't',
        })
        .expect(201);
      createdIds.push((res.body as CategoryBody).id);
    }
    const p0 = await raw()
      .get('/api/categories?sort=name&order=desc&page=0&size=2')
      .expect(200);
    const p1 = await raw()
      .get('/api/categories?sort=name&order=desc&page=1&size=2')
      .expect(200);
    const b0 = p0.body as CategoryBody[];
    const b1 = p1.body as CategoryBody[];
    const ids0 = new Set(b0.map((c) => c.id));
    for (const c of b1) {
      expect(ids0.has(c.id)).toBe(false);
    }
    if (b0.length >= 2) {
      expect(b0[0].name.localeCompare(b0[1].name)).toBeGreaterThanOrEqual(0);
    }
    if (b0.length > 0 && b1.length > 0) {
      expect(
        b0[b0.length - 1].name.localeCompare(b1[0].name),
      ).toBeGreaterThanOrEqual(0);
    }
    for (const id of createdIds) {
      await raw().delete(`/api/categories/${id}`).expect(204);
    }
  });

  it('PUT /api/categories/:id then DELETE when no products', async () => {
    const post = await raw()
      .post('/api/categories')
      .send({ name: 'DelCat', description: 'D1' })
      .expect(201);
    const cat = post.body as CategoryBody;

    await raw()
      .put(`/api/categories/${cat.id}`)
      .send({ name: 'DelCatUpdated' })
      .expect(200);

    const afterPut = await raw()
      .get(`/api/categories/${cat.id}`)
      .expect(200);
    expect((afterPut.body as CategoryBody).name).toBe('DelCatUpdated');

    await raw().delete(`/api/categories/${cat.id}`).expect(204);

    await raw().get(`/api/categories/${cat.id}`).expect(404);
  });

  it('DELETE /api/categories/:id returns 409 when products use category', async () => {
    const catRes = await raw()
      .post('/api/categories')
      .send({ name: 'HasProds', description: 'x' })
      .expect(201);
    const cat = catRes.body as CategoryBody;

    const prodRes = await raw()
      .post('/api/products')
      .send({ name: 'InCat', price: 1, categoryId: cat.id })
      .expect(201);
    const productId = (prodRes.body as { id: string }).id;

    const del = await raw()
      .delete(`/api/categories/${cat.id}`)
      .expect(409);
    const err = del.body as ErrorResponseBody;
    expect(err.status).toBe(409);
    expect(err.message).toContain("пов'язані товари");

    await raw().delete(`/api/products/${productId}`).expect(204);
    await raw().delete(`/api/categories/${cat.id}`).expect(204);
  });
});
