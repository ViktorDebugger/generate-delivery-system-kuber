import { INestApplication, RequestMethod } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import type { Server } from 'http';
import nock from 'nock';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';

const catalogOrigin = process.env.CATALOG_SERVICE_URL ?? '';
const fleetOrigin = process.env.FLEET_SERVICE_URL ?? '';

type ClientBody = { id: string };

type DeliveriesReportBody = {
  totalOrders: number;
  byStatus: Record<string, number>;
  byCourier: Array<{
    courierId: string | null;
    name: string | null;
    orderCount: number;
  }>;
  weight: { sum: number; average: number };
};

describe('Reports HTTP (e2e)', () => {
  let app: INestApplication | undefined;
  let httpServer: Server | undefined;
  let accessToken: string;

  const bearer = () => ({ Authorization: `Bearer ${accessToken}` });

  beforeAll(async () => {
    if (
      process.env.DATABASE_URL === undefined ||
      process.env.DATABASE_URL === ''
    ) {
      throw new Error('E2E requires DATABASE_URL (see .env.example)');
    }
    if (catalogOrigin === '' || fleetOrigin === '') {
      throw new Error('E2E requires CATALOG_SERVICE_URL and FLEET_SERVICE_URL');
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(new ErrorResponseFilter());
    await app.init();
    httpServer = app.getHttpServer() as Server;

    const workerEmail = `reports-e2e-worker-${Date.now()}@test.local`;
    const workerPassword = 'reports-e2e-worker-password-12';
    await request(httpServer)
      .post('/api/auth/register')
      .send({ email: workerEmail, password: workerPassword })
      .expect(201);
    const loginRes = await request(httpServer)
      .post('/api/auth/login')
      .send({ email: workerEmail, password: workerPassword })
      .expect(200);
    accessToken = (loginRes.body as { access_token: string }).access_token;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/reports/deliveries and deliveries.csv for filtered courier', async () => {
    const courierId = 'c0000000-0000-4000-8000-00000000e2e1';
    nock(fleetOrigin)
      .get(`/api/couriers/${courierId}`)
      .times(2)
      .reply(200, { id: courierId, isAvailable: true });

    const sa = await request(httpServer!)
      .post('/api/clients')
      .set(bearer())
      .send({ fullName: 'Rs', email: `rep-s-${randomUUID()}@test.local` })
      .expect(201);
    const ra = await request(httpServer!)
      .post('/api/clients')
      .set(bearer())
      .send({ fullName: 'Rr', email: `rep-r-${randomUUID()}@test.local` })
      .expect(201);
    const ca = sa.body as ClientBody;
    const cb = ra.body as ClientBody;

    const or1 = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `R1-${randomUUID()}`,
        weight: 10,
        senderId: ca.id,
        receiverId: cb.id,
        courierId,
      })
      .expect(201);
    const or2 = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `R2-${randomUUID()}`,
        weight: 20,
        senderId: ca.id,
        receiverId: cb.id,
        courierId,
      })
      .expect(201);
    const orderId1 = (or1.body as { id: string }).id;
    const orderId2 = (or2.body as { id: string }).id;

    const from = '1970-01-01T00:00:00.000Z';
    const to = '2099-12-31T23:59:59.999Z';
    const q = `dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}&courierId=${encodeURIComponent(courierId)}`;

    const rep = await request(httpServer!)
      .get(`/api/reports/deliveries?${q}`)
      .set(bearer())
      .expect(200);
    const body = rep.body as DeliveriesReportBody;
    expect(body.totalOrders).toBe(2);
    expect(body.byStatus.ASSIGNED).toBe(2);
    expect(body.weight.sum).toBeCloseTo(30, 5);
    expect(body.weight.average).toBeCloseTo(15, 5);
    const slice = body.byCourier.find((r) => r.courierId === courierId);
    expect(slice?.orderCount).toBe(2);

    const csvRes = await request(httpServer!)
      .get(`/api/reports/deliveries.csv?${q}`)
      .set(bearer())
      .expect(200);
    expect(csvRes.headers['content-type'] ?? '').toMatch(/text\/csv/i);
    const csvText = csvRes.text as string;
    expect(csvText).toContain('totalOrders');
    expect(csvText).toContain('2,30');
    expect(
      csvText.split('\n').filter((line) => line.length > 0).length,
    ).toBeGreaterThanOrEqual(5);

    await request(httpServer!)
      .delete(`/api/orders/${orderId1}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/orders/${orderId2}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${ca.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${cb.id}`)
      .set(bearer())
      .expect(204);
  });
});
