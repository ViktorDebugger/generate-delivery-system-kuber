import type { IncomingMessage } from 'http';
import { createServer, type Server } from 'http';
import type { INestApplication } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createGatewayApplication } from '../src/gateway-bootstrap';

const ENV_KEYS = [
  'CATALOG_SERVICE_URL',
  'FLEET_SERVICE_URL',
  'ORDER_SERVICE_URL',
  'JWT_SECRET',
  'GATEWAY_REQUIRE_JWT',
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

function saveEnv(): Partial<Record<EnvKey, string | undefined>> {
  const saved: Partial<Record<EnvKey, string | undefined>> = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
  }
  return saved;
}

function restoreEnv(saved: Partial<Record<EnvKey, string | undefined>>): void {
  for (const k of ENV_KEYS) {
    const v = saved[k];
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

type MockReply = { status: number; body: Record<string, unknown> };

function startMockServer(
  handler: (req: IncomingMessage) => MockReply | null,
): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const reply = handler(req);
      if (reply === null) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.statusCode = reply.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(reply.body));
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (typeof addr !== 'object' || addr === null) {
        reject(new Error('mock server: no address'));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err !== undefined) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

describe('API Gateway integration', () => {
  let savedEnv: Partial<Record<EnvKey, string | undefined>>;
  let catalogServer: Server;
  let fleetServer: Server;
  let orderServer: Server;
  let app: INestApplication;
  let httpServer: Server;
  const jwtSecret = 'integration-gateway-jwt-secret';

  beforeAll(async () => {
    savedEnv = saveEnv();
    process.env['JWT_SECRET'] = jwtSecret;
    process.env['GATEWAY_REQUIRE_JWT'] = 'true';

    const catalog = await startMockServer((req) => {
      if (req.method !== 'GET' || typeof req.url !== 'string') {
        return null;
      }
      if (!req.url.startsWith('/api/ping')) {
        return null;
      }
      return {
        status: 200,
        body: {
          service: 'catalog',
          authorization: req.headers.authorization ?? null,
          path: req.url,
        },
      };
    });
    catalogServer = catalog.server;
    process.env['CATALOG_SERVICE_URL'] = catalog.baseUrl;

    const fleet = await startMockServer((req) => {
      if (req.method !== 'GET' || typeof req.url !== 'string') {
        return null;
      }
      if (!req.url.startsWith('/api/status')) {
        return null;
      }
      return {
        status: 200,
        body: {
          service: 'fleet',
          authorization: req.headers.authorization ?? null,
          path: req.url,
        },
      };
    });
    fleetServer = fleet.server;
    process.env['FLEET_SERVICE_URL'] = fleet.baseUrl;

    const order = await startMockServer((req) => {
      if (req.method !== 'GET' || typeof req.url !== 'string') {
        return null;
      }
      if (req.url === '/api/clients/proxy-smoke') {
        return {
          status: 200,
          body: {
            service: 'order',
            authorization: req.headers.authorization ?? null,
            path: req.url,
          },
        };
      }
      if (req.url === '/api/orders/proxy-teapot') {
        return {
          status: 418,
          body: { service: 'order', code: 'teapot' },
        };
      }
      return null;
    });
    orderServer = order.server;
    process.env['ORDER_SERVICE_URL'] = order.baseUrl;

    app = await createGatewayApplication({ logger: false });
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
    await closeServer(catalogServer);
    await closeServer(fleetServer);
    await closeServer(orderServer);
    restoreEnv(savedEnv);
  });

  it('GET /health responds without JWT', async () => {
    await request(httpServer)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });

  it('rejects proxied /api/catalog without Authorization (401)', async () => {
    await request(httpServer)
      .get('/api/catalog/ping')
      .expect(401)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
  });

  it('forwards Authorization to catalog upstream and returns its JSON', async () => {
    const token = jwt.sign(
      {
        sub: '11111111-1111-1111-1111-111111111111',
        email: 'integration@example.com',
      },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const authHeader = `Bearer ${token}`;
    await request(httpServer)
      .get('/api/catalog/ping')
      .set('Authorization', authHeader)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          service: 'catalog',
          authorization: authHeader,
          path: '/api/ping',
        });
      });
  });

  it('rewrites /api/fleet path and forwards Authorization to fleet upstream', async () => {
    const token = jwt.sign(
      {
        sub: '22222222-2222-2222-2222-222222222222',
        email: 'fleet@example.com',
      },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const authHeader = `Bearer ${token}`;
    await request(httpServer)
      .get('/api/fleet/status')
      .set('Authorization', authHeader)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          service: 'fleet',
          authorization: authHeader,
          path: '/api/status',
        });
      });
  });

  it('proxies /api/clients to order-service without path rewrite', async () => {
    const token = jwt.sign(
      {
        sub: '33333333-3333-3333-3333-333333333333',
        email: 'order@example.com',
      },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const authHeader = `Bearer ${token}`;
    await request(httpServer)
      .get('/api/clients/proxy-smoke')
      .set('Authorization', authHeader)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          service: 'order',
          authorization: authHeader,
          path: '/api/clients/proxy-smoke',
        });
      });
  });

  it('passes through upstream HTTP status from order-service', async () => {
    const token = jwt.sign(
      {
        sub: '44444444-4444-4444-4444-444444444444',
        email: 'teapot@example.com',
      },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    await request(httpServer)
      .get('/api/orders/proxy-teapot')
      .set('Authorization', `Bearer ${token}`)
      .expect(418)
      .expect((res) => {
        expect(res.body).toEqual({ service: 'order', code: 'teapot' });
      });
  });
});
