import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';

type TransportBody = {
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

type CourierBody = {
  id: string;
  name: string;
  transportId?: string;
};

describe('Transports HTTP (e2e)', () => {
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

  it('GET /api/transports returns array', async () => {
    const res = await raw().get('/api/transports').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/transports then GET list and GET /api/transports/:id', async () => {
    const post = await raw()
      .post('/api/transports')
      .send({ name: 'Bike', description: 'Two wheels' })
      .expect(201);
    const created = post.body as TransportBody;

    const listRes = await raw()
      .get('/api/transports?page=0&size=100')
      .expect(200);
    const list = listRes.body as TransportBody[];
    expect(Array.isArray(list)).toBe(true);

    const one = await raw().get(`/api/transports/${created.id}`).expect(200);
    const body = one.body as TransportBody;
    expect(body.name).toBe('Bike');
    expect(body.description).toBe('Two wheels');

    await raw().delete(`/api/transports/${created.id}`).expect(204);
  });

  it('PUT /api/transports/:id then DELETE when no couriers', async () => {
    const post = await raw()
      .post('/api/transports')
      .send({ name: 'TrDel', description: 'X' })
      .expect(201);
    const tr = post.body as TransportBody;

    await raw()
      .put(`/api/transports/${tr.id}`)
      .send({ name: 'TrUpdated' })
      .expect(200);

    const one = await raw().get(`/api/transports/${tr.id}`).expect(200);
    expect((one.body as TransportBody).name).toBe('TrUpdated');

    await raw().delete(`/api/transports/${tr.id}`).expect(204);

    await raw().get(`/api/transports/${tr.id}`).expect(404);
  });

  it('DELETE /api/transports/:id returns 409 when couriers use transport', async () => {
    const tRes = await raw()
      .post('/api/transports')
      .send({ name: 'TrLocked' })
      .expect(201);
    const tr = tRes.body as TransportBody;

    const cRes = await raw()
      .post('/api/couriers')
      .send({ name: 'C1', transportId: tr.id, isAvailable: true })
      .expect(201);
    const courier = cRes.body as CourierBody;

    const del = await raw().delete(`/api/transports/${tr.id}`).expect(409);
    const err = del.body as ErrorResponseBody;
    expect(err.status).toBe(409);
    expect(err.message).toContain("кур'єри");

    await raw().delete(`/api/couriers/${courier.id}`).expect(204);
    await raw().delete(`/api/transports/${tr.id}`).expect(204);
  });
});
