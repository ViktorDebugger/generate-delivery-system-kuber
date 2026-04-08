import { INestApplication, RequestMethod } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { Server } from 'http';
import nock from 'nock';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';
import { PrismaService } from '../src/prisma/prisma.service';

type ClientBody = {
  id: string;
  fullName: string;
  email: string;
};

type ErrorResponseBody = {
  timestamp: string;
  status: number;
  message: string;
  path: string;
};

const catalogOrigin = process.env.CATALOG_SERVICE_URL ?? '';
const fleetOrigin = process.env.FLEET_SERVICE_URL ?? '';

const api = (path: string) => `/api${path.startsWith('/') ? path : `/${path}`}`;

const e2eEmail = (label: string): string =>
  `e2e.${label}.${randomUUID()}@example.com`;

describe('Clients HTTP (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let authAgent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === '') {
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

    const prisma = app.get(PrismaService);
    const workerEmail = e2eEmail('worker');
    const workerPassword = 'e2e-worker-password';
    await prisma.user.create({
      data: {
        email: workerEmail,
        passwordHash: await bcrypt.hash(workerPassword, 10),
      },
    });
    const loginRes = await request(httpServer)
      .post(api('/auth/login'))
      .send({ email: workerEmail, password: workerPassword })
      .expect(200);
    const accessToken = (loginRes.body as { access_token: string }).access_token;
    authAgent = request.agent(httpServer);
    authAgent.set('Authorization', `Bearer ${accessToken}`);
  });

  afterEach(async () => {
    nock.cleanAll();
    await app.close();
  });

  it('GET /api/clients returns array', async () => {
    const res = await authAgent.get(api('/clients')).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/clients then GET list and GET /api/clients/:id', async () => {
    const clientEmail = e2eEmail('clients-flow');
    const post = await authAgent
      .post(api('/clients'))
      .send({
        fullName: 'Test User',
        email: clientEmail,
        address: 'Kyiv',
      })
      .expect(201);

    const created = post.body as ClientBody;
    const list = await authAgent
      .get(api('/clients?page=0&size=100'))
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    const get = await authAgent.get(api(`/clients/${created.id}`)).expect(200);

    const found = get.body as ClientBody;
    expect(found.fullName).toBe('Test User');
    expect(found.email).toBe(clientEmail);

    await authAgent.delete(api(`/clients/${created.id}`)).expect(204);
  });

  it('GET /api/clients/:id returns 404 ErrorResponse for unknown id', async () => {
    const url = api('/clients/00000000-0000-0000-0000-000000000000');
    const res = await authAgent.get(url).expect(404);
    const err = res.body as ErrorResponseBody;
    expect(err.status).toBe(404);
    expect(typeof err.message).toBe('string');
    expect(err.message.length).toBeGreaterThan(0);
    expect(err.path).toBe(url);
    expect(Number.isNaN(Date.parse(err.timestamp))).toBe(false);
    expect(Object.keys(err).sort()).toEqual([
      'message',
      'path',
      'status',
      'timestamp',
    ]);
  });

  it('POST /api/clients with invalid body returns 400 ErrorResponse', async () => {
    const url = api('/clients');
    const res = await authAgent
      .post(url)
      .send({ fullName: '', email: 'not-an-email' })
      .expect(400);
    const err = res.body as ErrorResponseBody;
    expect(err.status).toBe(400);
    expect(typeof err.message).toBe('string');
    expect(err.message.length).toBeGreaterThan(0);
    expect(err.path).toBe(url);
    expect(Number.isNaN(Date.parse(err.timestamp))).toBe(false);
    expect(Object.keys(err).sort()).toEqual([
      'message',
      'path',
      'status',
      'timestamp',
    ]);
  });

  it('PUT /api/clients/:id then DELETE then GET 404', async () => {
    const email = e2eEmail('put-del-flow');
    const post = await authAgent
      .post(api('/clients'))
      .send({
        fullName: 'Before',
        email,
        address: 'Kyiv',
      })
      .expect(201);
    const created = post.body as ClientBody;
    const newEmail = e2eEmail('put-del-updated');

    await authAgent
      .put(api(`/clients/${created.id}`))
      .send({ fullName: 'After', email: newEmail })
      .expect(200);

    const one = await authAgent.get(api(`/clients/${created.id}`)).expect(200);
    const body = one.body as ClientBody;
    expect(body.fullName).toBe('After');
    expect(body.email).toBe(newEmail);

    await authAgent.delete(api(`/clients/${created.id}`)).expect(204);

    await authAgent.get(api(`/clients/${created.id}`)).expect(404);
  });

  it('DELETE /api/clients/:id returns 409 when client has orders', async () => {
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, []);

    const s = await authAgent
      .post(api('/clients'))
      .send({ fullName: 'S', email: e2eEmail('del409-s') })
      .expect(201);
    const r = await authAgent
      .post(api('/clients'))
      .send({ fullName: 'R', email: e2eEmail('del409-r') })
      .expect(201);
    const sender = s.body as ClientBody;
    const recv = r.body as ClientBody;

    const ordRes = await authAgent
      .post(api('/orders'))
      .send({
        orderNumber: `ORD-DEL409-${randomUUID()}`,
        weight: 1,
        senderId: sender.id,
        receiverId: recv.id,
      })
      .expect(201);
    const orderId = (ordRes.body as { id: string }).id;

    const del = await authAgent
      .delete(api(`/clients/${sender.id}`))
      .expect(409);
    const err = del.body as ErrorResponseBody;
    expect(err.status).toBe(409);
    expect(err.message).toContain("пов'язані замовлення");

    await authAgent.delete(api(`/orders/${orderId}`)).expect(204);
    await authAgent.delete(api(`/clients/${sender.id}`)).expect(204);
    await authAgent.delete(api(`/clients/${recv.id}`)).expect(204);
  });

  it('PUT /api/clients/:id and DELETE /api/clients/:id return 404 for unknown id', async () => {
    const unknownId = '00000000-0000-0000-0000-000000000001';
    await authAgent
      .put(api(`/clients/${unknownId}`))
      .send({ fullName: 'N', email: e2eEmail('client-put-unknown') })
      .expect(404);
    await authAgent.delete(api(`/clients/${unknownId}`)).expect(404);
  });

  it('HTTP PATCH /api/clients/:id returns 404 (not implemented)', async () => {
    await authAgent
      .patch(api('/clients/00000000-0000-0000-0000-000000000099'))
      .send({ fullName: 'Y' })
      .expect(404);
  });
});
