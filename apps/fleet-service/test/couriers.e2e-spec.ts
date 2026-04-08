import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
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

type CourierBody = {
  id: string;
  name: string;
  transportId?: string;
  transport?: TransportBody;
  isAvailable: boolean;
};

type CourierLocationBody = {
  id: string;
  courierId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

type ErrorResponseBody = {
  timestamp: string;
  status: number;
  message: string;
  path: string;
};

describe('Couriers HTTP (e2e)', () => {
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

  it('POST /api/couriers with transportId then GET list and GET /api/couriers/:id embeds transport', async () => {
    const tRes = await raw()
      .post('/api/transports')
      .send({ name: 'Cargo bike' })
      .expect(201);
    const tr = tRes.body as TransportBody;

    const post = await raw()
      .post('/api/couriers')
      .send({ name: 'Ivan', transportId: tr.id, isAvailable: true })
      .expect(201);
    const created = post.body as CourierBody;

    const listRes = await raw()
      .get('/api/couriers?page=0&size=100')
      .expect(200);
    const list = listRes.body as CourierBody[];
    expect(Array.isArray(list)).toBe(true);

    const one = await raw().get(`/api/couriers/${created.id}`).expect(200);
    const body = one.body as CourierBody;
    expect(body.name).toBe('Ivan');
    expect(body.transportId).toBe(tr.id);
    expect(body.transport?.id).toBe(tr.id);
    expect(body.transport?.name).toBe('Cargo bike');
    expect(body.isAvailable).toBe(true);

    await raw().delete(`/api/couriers/${created.id}`).expect(204);
    await raw().delete(`/api/transports/${tr.id}`).expect(204);
  });

  it('PUT /api/couriers/:id then DELETE when no orders', async () => {
    const post = await raw()
      .post('/api/couriers')
      .send({ name: 'CrDel', isAvailable: true })
      .expect(201);
    const cr = post.body as CourierBody;

    await raw()
      .put(`/api/couriers/${cr.id}`)
      .send({ name: 'CrUpdated', isAvailable: false })
      .expect(200);

    const one = await raw().get(`/api/couriers/${cr.id}`).expect(200);
    const b = one.body as CourierBody;
    expect(b.name).toBe('CrUpdated');
    expect(b.isAvailable).toBe(false);

    await raw().delete(`/api/couriers/${cr.id}`).expect(204);

    await raw().get(`/api/couriers/${cr.id}`).expect(404);
  });

  it('POST /api/couriers/:id/locations and GET latest; invalid courier 400 on bad coords', async () => {
    const tRes = await raw()
      .post('/api/transports')
      .send({ name: `Tr-loc-${randomUUID()}` })
      .expect(201);
    const tr = tRes.body as TransportBody;
    const cRes = await raw()
      .post('/api/couriers')
      .send({
        name: `LocCourier-${randomUUID()}`,
        transportId: tr.id,
        isAvailable: true,
      })
      .expect(201);
    const courier = cRes.body as CourierBody;

    const fakeOrderId = randomUUID();
    const lat = 50.4501;
    const lng = 30.5234;
    const postLoc = await raw()
      .post(`/api/couriers/${courier.id}/locations`)
      .send({ latitude: lat, longitude: lng, orderId: fakeOrderId })
      .expect(201);
    const createdLoc = postLoc.body as CourierLocationBody;
    expect(createdLoc.courierId).toBe(courier.id);
    expect(createdLoc.orderId).toBe(fakeOrderId);
    expect(createdLoc.latitude).toBeCloseTo(lat, 5);
    expect(createdLoc.longitude).toBeCloseTo(lng, 5);
    expect(createdLoc.recordedAt.length).toBeGreaterThan(0);

    const byCourier = await raw()
      .get(`/api/couriers/${courier.id}/locations/latest`)
      .expect(200);
    const b1 = byCourier.body as CourierLocationBody;
    expect(b1.id).toBe(createdLoc.id);
    expect(b1.latitude).toBeCloseTo(lat, 5);
    expect(b1.longitude).toBeCloseTo(lng, 5);

    await raw()
      .get(
        '/api/couriers/00000000-0000-4000-8000-000000000088/locations/latest',
      )
      .expect(404);

    const badLat = await raw()
      .post(`/api/couriers/${courier.id}/locations`)
      .send({ latitude: 200, longitude: 0 })
      .expect(400);
    expect((badLat.body as ErrorResponseBody).status).toBe(400);

    await raw().delete(`/api/couriers/${courier.id}`).expect(204);
    await raw().delete(`/api/transports/${tr.id}`).expect(204);
  });
});
