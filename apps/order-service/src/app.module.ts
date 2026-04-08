import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { HealthController } from './health/health.controller';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '.env')],
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    OrdersModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
