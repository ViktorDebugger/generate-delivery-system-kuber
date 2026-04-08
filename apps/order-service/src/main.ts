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
    .setTitle('Order Service')
    .setDescription('Клієнти та замовлення')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Реєстрація та логін (JWT access_token)')
    .addTag('clients')
    .addTag('orders')
    .addTag('reports', 'Звіти')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
}
void bootstrap();
