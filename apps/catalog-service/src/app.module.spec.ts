import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  beforeAll(() => {
    process.env.DATABASE_URL ??=
      'postgresql://test:test@127.0.0.1:5432/test_catalog_app_module';
  });

  it('compiles', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
