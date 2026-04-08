import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { CategoriesModule } from './categories/categories.module';
import { HealthController } from './health/health.controller';
import { InternalModule } from './internal/internal.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '.env')],
    }),
    PrismaModule,
    CategoriesModule,
    ProductsModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
