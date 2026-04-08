import { INestApplication, RequestMethod } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';
import { PrismaService } from '../src/prisma/prisma.service';

type ErrorResponseBody = {
  timestamp: string;
  status: number;
  message: string;
  path: string;
};

const api = (path: string) => `/api${path.startsWith('/') ? path : `/${path}`}`;

const e2eEmail = (label: string): string =>
  `e2e.${label}.${randomUUID()}@example.com`;

describe('Auth HTTP (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let workerUserId: string;
  let workerEmail: string;

  const rawReq = () => request(httpServer);

  beforeEach(async () => {
    if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === '') {
      throw new Error('E2E requires DATABASE_URL (see .env.example)');
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
    workerEmail = e2eEmail('worker');
    const workerPassword = 'e2e-worker-password';
    const workerRow = await prisma.user.create({
      data: {
        email: workerEmail,
        passwordHash: await bcrypt.hash(workerPassword, 10),
      },
    });
    workerUserId = workerRow.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 without Authorization for representative protected path', async () => {
    await rawReq().get(api('/clients')).expect(401);
  });

  it('returns 401 for malformed Bearer token', async () => {
    await rawReq()
      .get(api('/clients'))
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);
  });

  it('returns 401 for expired JWT', async () => {
    const jwtService = app.get(JwtService);
    const token = await jwtService.signAsync(
      { sub: workerUserId, email: workerEmail },
      { expiresIn: '1ms' },
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    await rawReq()
      .get(api('/clients'))
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('POST /api/auth/register creates worker and login works without prior token', async () => {
    const newEmail = e2eEmail('registered-worker');
    const newPassword = 'register-pass-ok-8';
    const res = await rawReq()
      .post(api('/auth/register'))
      .send({ email: newEmail, password: newPassword })
      .expect(201);
    const body = res.body as { id: string; email: string };
    expect(body.email).toBe(newEmail);
    expect(body.id.length).toBeGreaterThan(0);
    expect('password' in body).toBe(false);
    expect('passwordHash' in body).toBe(false);

    const loginRes = await rawReq()
      .post(api('/auth/login'))
      .send({ email: newEmail, password: newPassword })
      .expect(200);
    expect(
      (loginRes.body as { access_token: string }).access_token.length,
    ).toBeGreaterThan(0);
  });

  it('POST /api/auth/register returns 409 for duplicate email', async () => {
    const newEmail = e2eEmail('dup-register');
    await rawReq()
      .post(api('/auth/register'))
      .send({ email: newEmail, password: 'password12' })
      .expect(201);
    const res = await rawReq()
      .post(api('/auth/register'))
      .send({ email: newEmail, password: 'otherpass12' })
      .expect(409);
    const err = res.body as ErrorResponseBody;
    expect(err.status).toBe(409);
  });
});
