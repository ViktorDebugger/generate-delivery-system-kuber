import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { CouriersModule } from './couriers/couriers.module';
import { HealthController } from './health/health.controller';
import { InternalModule } from './internal/internal.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransportsModule } from './transports/transports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '.env')],
    }),
    PrismaModule,
    TransportsModule,
    CouriersModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
