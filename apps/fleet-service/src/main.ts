import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ErrorResponseFilter } from './common/filters/error-response.filter';
import { createGlobalValidationPipe } from './common/validation/global-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(createGlobalValidationPipe());
  app.useGlobalFilters(new ErrorResponseFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fleet Service')
    .setDescription('Транспорт, кур’єри, геолокація')
    .setVersion('1.0')
    .addTag('transports')
    .addTag('couriers')
    .addTag('internal', 'Міжсервісні ендпоінти (/api/internal/...)')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Internal-Api-Key',
        in: 'header',
        description:
          'Опційно: якщо INTERNAL_API_KEY задано в env, передайте той самий ключ',
      },
      'internal-api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
}
void bootstrap();
