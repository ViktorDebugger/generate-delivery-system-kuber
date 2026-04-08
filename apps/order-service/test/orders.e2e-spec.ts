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

type ClientBody = {
  id: string;
  email: string;
  fullName?: string;
};

type OrderByIdBody = {
  id: string;
  orderNumber: string;
  status: string;
  weight?: number;
  senderId: string;
  receiverId: string;
  courierId?: string;
  products?: Array<{ id: string }>;
};

type OrderListItem = { id: string; status: string; weight?: number };

type ErrorResponseBody = {
  status: number;
  message: string;
};

type OrderWithSenderBody = {
  orderNumber: string;
  sender: ClientBody;
};

describe('Orders HTTP (e2e)', () => {
  let app: INestApplication | undefined;
  let httpServer: Server | undefined;
  let accessToken: string;

  const bearer = () => ({ Authorization: `Bearer ${accessToken}` });

  const postClientsPair = async (): Promise<{
    sender: ClientBody;
    receiver: ClientBody;
  }> => {
    const senderRes = await request(httpServer!)
      .post('/api/clients')
      .set(bearer())
      .send({
        fullName: 'S',
        email: `e2e-s-${randomUUID()}@test.local`,
      })
      .expect(201);
    const receiverRes = await request(httpServer!)
      .post('/api/clients')
      .set(bearer())
      .send({
        fullName: 'R',
        email: `e2e-r-${randomUUID()}@test.local`,
      })
      .expect(201);
    return {
      sender: senderRes.body as ClientBody,
      receiver: receiverRes.body as ClientBody,
    };
  };

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

    const workerEmail = `orders-e2e-worker-${Date.now()}@test.local`;
    const workerPassword = 'orders-e2e-worker-password-12';
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

  it('creates order when catalog accepts product and fleet has no couriers', async () => {
    const productId = `e2e-prod-${Date.now()}`;
    nock(catalogOrigin)
      .get(`/api/internal/products/${productId}`)
      .reply(200, { id: productId, name: 'X', price: 1, categoryId: null });

    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, []);

    const { sender, receiver } = await postClientsPair();

    const ord = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `E2E-${Date.now()}`,
        weight: 2,
        senderId: sender.id,
        receiverId: receiver.id,
        productIds: [productId],
      })
      .expect(201);

    expect((ord.body as OrderByIdBody).status).toBe('CREATED');
    expect((ord.body as OrderByIdBody).products).toEqual([{ id: productId }]);

    await request(httpServer!)
      .delete(`/api/orders/${(ord.body as OrderByIdBody).id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('returns 400 when catalog returns 404 for product', async () => {
    const productId = `missing-${Date.now()}`;
    nock(catalogOrigin)
      .get(`/api/internal/products/${productId}`)
      .reply(404, { message: 'Not Found' });

    const { sender, receiver } = await postClientsPair();

    const res = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `E2E-FAIL-${Date.now()}`,
        weight: 1,
        senderId: sender.id,
        receiverId: receiver.id,
        productIds: [productId],
      })
      .expect(400);

    const body = res.body as ErrorResponseBody;
    expect(body.status).toBe(400);
    expect(body.message).toContain('Товар');

    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('POST /api/orders then GET list and GET /api/orders/:id', async () => {
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, []);

    const { sender, receiver } = await postClientsPair();

    const ordPost = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `BY-ID-${randomUUID().slice(0, 8)}`,
        weight: 3,
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(201);
    const orderBody = ordPost.body as OrderByIdBody;
    const orderId = orderBody.id;
    expect(['CREATED', 'ASSIGNED']).toContain(orderBody.status);

    const listRes = await request(httpServer!)
      .get('/api/orders?page=0&size=100')
      .set(bearer())
      .expect(200);
    const orders = listRes.body as OrderByIdBody[];
    expect(Array.isArray(orders)).toBe(true);

    const one = await request(httpServer!)
      .get(`/api/orders/${orderId}`)
      .set(bearer())
      .expect(200);
    const ob = one.body as OrderByIdBody;
    expect(ob.id).toBe(orderId);
    expect(ob.orderNumber).toBe(orderBody.orderNumber);
    expect(ob.senderId).toBe(sender.id);
    expect(ob.receiverId).toBe(receiver.id);

    await request(httpServer!)
      .delete(`/api/orders/${orderId}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('GET /api/orders with status filter and sort', async () => {
    const productId = `e2e-filt-${randomUUID()}`;
    nock(catalogOrigin)
      .get(`/api/internal/products/${productId}`)
      .reply(200, { id: productId, name: 'Box', price: 10, categoryId: null });
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, []);

    const { sender, receiver } = await postClientsPair();

    const firstPost = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `ON-1-${randomUUID()}`,
        weight: 2,
        senderId: sender.id,
        receiverId: receiver.id,
        productIds: [productId],
      })
      .expect(201);
    const firstOrderId = (firstPost.body as OrderByIdBody).id;

    const cancelledPost = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `ON-2-${randomUUID()}`,
        weight: 1,
        status: 'CANCELLED',
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(201);
    const cancelledId = (cancelledPost.body as OrderByIdBody).id;

    const filtered = await request(httpServer!)
      .get(
        '/api/orders?status=CANCELLED&sort=weight&order=asc&page=0&size=100',
      )
      .set(bearer())
      .expect(200);

    const list = filtered.body as OrderListItem[];
    expect(Array.isArray(list)).toBe(true);
    const ours = list.filter((o) => o.id === cancelledId);
    expect(ours).toHaveLength(1);
    expect(ours[0].status).toBe('CANCELLED');

    await request(httpServer!)
      .delete(`/api/orders/${firstOrderId}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/orders/${cancelledId}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('POST assigns courier when fleet returns available couriers and PUT advances to IN_TRANSIT', async () => {
    const courierId = 'a0000000-0000-4000-8000-000000000099';
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, [
      { id: courierId, isAvailable: true },
    ]);

    const { sender, receiver } = await postClientsPair();

    const created = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `AUTO-${randomUUID()}`,
        weight: 2.5,
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(201);
    const ob = created.body as OrderByIdBody;
    expect(ob.status).toBe('ASSIGNED');
    expect(ob.courierId).toBe(courierId);

    await request(httpServer!)
      .put(`/api/orders/${ob.id}`)
      .set(bearer())
      .send({
        orderNumber: ob.orderNumber,
        weight: ob.weight,
        status: 'IN_TRANSIT',
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(200);

    const after = await request(httpServer!)
      .get(`/api/orders/${ob.id}`)
      .set(bearer())
      .expect(200);
    expect((after.body as OrderByIdBody).status).toBe('IN_TRANSIT');

    await request(httpServer!)
      .delete(`/api/orders/${ob.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('PATCH /api/orders/:id/status updates status, 400 on forbidden transition, 404 missing', async () => {
    const courierId = 'b0000000-0000-4000-8000-000000000088';
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, [
      { id: courierId, isAvailable: true },
    ]);

    const { sender, receiver } = await postClientsPair();

    const created = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `PATCH-ST-${randomUUID()}`,
        weight: 1,
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(201);
    const ord = created.body as OrderByIdBody;
    expect(ord.status).toBe('ASSIGNED');
    expect(ord.courierId).toBe(courierId);

    await request(httpServer!)
      .patch(`/api/orders/${ord.id}/status`)
      .set(bearer())
      .send({ status: 'IN_TRANSIT' })
      .expect(200);
    const mid = await request(httpServer!)
      .get(`/api/orders/${ord.id}`)
      .set(bearer())
      .expect(200);
    expect((mid.body as OrderByIdBody).status).toBe('IN_TRANSIT');

    const bad = await request(httpServer!)
      .patch(`/api/orders/${ord.id}/status`)
      .set(bearer())
      .send({ status: 'CREATED' })
      .expect(400);
    expect((bad.body as ErrorResponseBody).status).toBe(400);

    await request(httpServer!)
      .patch(
        '/api/orders/00000000-0000-4000-8000-000000000099/status',
      )
      .set(bearer())
      .send({ status: 'IN_TRANSIT' })
      .expect(404);

    await request(httpServer!)
      .delete(`/api/orders/${ord.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('PUT /api/orders/:id returns 400 for forbidden status transition from CANCELLED', async () => {
    const { sender, receiver } = await postClientsPair();

    const ordPost = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `ST-${randomUUID()}`,
        weight: 1,
        status: 'CANCELLED',
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(201);
    const order = ordPost.body as OrderByIdBody;
    expect(order.status).toBe('CANCELLED');

    const res = await request(httpServer!)
      .put(`/api/orders/${order.id}`)
      .set(bearer())
      .send({
        orderNumber: order.orderNumber,
        weight: order.weight,
        status: 'DELIVERED',
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(400);
    const err = res.body as ErrorResponseBody;
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/Заборонений перехід статусу/);

    await request(httpServer!)
      .delete(`/api/orders/${order.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('GET /api/orders/:id/with-sender returns sender from store', async () => {
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, []);

    const spEmail = `sender-${randomUUID()}@test.local`;
    const rpEmail = `receiver-${randomUUID()}@test.local`;
    const senderRes = await request(httpServer!)
      .post('/api/clients')
      .set(bearer())
      .send({ fullName: 'Sender Person', email: spEmail })
      .expect(201);
    const recvRes = await request(httpServer!)
      .post('/api/clients')
      .set(bearer())
      .send({ fullName: 'Receiver Person', email: rpEmail })
      .expect(201);
    const sender = senderRes.body as ClientBody;
    const recv = recvRes.body as ClientBody;

    const orderNumber = `AGG-${randomUUID().slice(0, 8)}`;
    const orderRes = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber,
        weight: 1.5,
        senderId: sender.id,
        receiverId: recv.id,
      })
      .expect(201);
    const orderId = (orderRes.body as OrderByIdBody).id;

    const agg = await request(httpServer!)
      .get(`/api/orders/${orderId}/with-sender`)
      .set(bearer())
      .expect(200);
    const body = agg.body as OrderWithSenderBody;
    expect(body.orderNumber).toBe(orderNumber);
    expect(body.sender.id).toBe(sender.id);
    expect(body.sender.fullName).toBe('Sender Person');
    expect(body.sender.email).toBe(spEmail);

    await request(httpServer!)
      .delete(`/api/orders/${orderId}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${recv.id}`)
      .set(bearer())
      .expect(204);
  });

  it('PUT /api/orders/:id then DELETE then GET 404', async () => {
    nock(fleetOrigin).get('/api/internal/couriers/available').reply(200, []);

    const { sender, receiver } = await postClientsPair();

    const ordPost = await request(httpServer!)
      .post('/api/orders')
      .set(bearer())
      .send({
        orderNumber: `O-PUT-${randomUUID()}`,
        weight: 1,
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(201);
    const orderId = (ordPost.body as OrderByIdBody).id;
    const initialStatus = (ordPost.body as OrderByIdBody).status;
    const nextStatus =
      initialStatus === 'ASSIGNED' ? 'IN_TRANSIT' : 'CANCELLED';

    await request(httpServer!)
      .put(`/api/orders/${orderId}`)
      .set(bearer())
      .send({
        orderNumber: 'UPD-N',
        weight: 5,
        status: nextStatus,
        senderId: sender.id,
        receiverId: receiver.id,
      })
      .expect(200);

    const one = await request(httpServer!)
      .get(`/api/orders/${orderId}`)
      .set(bearer())
      .expect(200);
    const ob = one.body as OrderByIdBody;
    expect(ob.orderNumber).toBe('UPD-N');
    expect(ob.weight).toBe(5);
    expect(ob.status).toBe(nextStatus);

    await request(httpServer!)
      .delete(`/api/orders/${orderId}`)
      .set(bearer())
      .expect(204);

    await request(httpServer!)
      .get(`/api/orders/${orderId}`)
      .set(bearer())
      .expect(404);

    await request(httpServer!)
      .delete(`/api/clients/${sender.id}`)
      .set(bearer())
      .expect(204);
    await request(httpServer!)
      .delete(`/api/clients/${receiver.id}`)
      .set(bearer())
      .expect(204);
  });

  it('DELETE /api/orders/:id returns 404 for unknown id', async () => {
    await request(httpServer!)
      .delete('/api/orders/00000000-0000-0000-0000-000000000099')
      .set(bearer())
      .expect(404);
  });
});
