import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorResponseFilter } from '../src/common/filters/error-response.filter';
import { createGlobalValidationPipe } from '../src/common/validation/global-validation.pipe';

type CourierCreateResponse = {
  id: string;
  name: string;
  isAvailable: boolean;
  transportId?: string;
};

type LocationResponse = {
  id: string;
  courierId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

describe('Fleet HTTP (e2e)', () => {
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

  it('creates courier, records location, returns latest', async () => {
    const createRes = await request(httpServer!)
      .post('/api/couriers')
      .send({
        name: `E2E Courier ${Date.now()}`,
        isAvailable: true,
      })
      .expect(201);

    const courier = createRes.body as CourierCreateResponse;
    const courierId = courier.id;

    const lat = 49.84;
    const lon = 24.03;

    const locPost = await request(httpServer!)
      .post(`/api/couriers/${courierId}/locations`)
      .send({ latitude: lat, longitude: lon })
      .expect(201);

    const posted = locPost.body as LocationResponse;
    expect(posted.latitude).toBe(lat);
    expect(posted.longitude).toBe(lon);
    expect(posted.courierId).toBe(courierId);

    const latestRes = await request(httpServer!)
      .get(`/api/couriers/${courierId}/locations/latest`)
      .expect(200);

    const latest = latestRes.body as LocationResponse;
    expect(latest.latitude).toBe(lat);
    expect(latest.longitude).toBe(lon);
    expect(latest.courierId).toBe(courierId);

    await request(httpServer!).delete(`/api/couriers/${courierId}`).expect(204);
  });
});
