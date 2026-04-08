import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { IntegrationModule } from '../integration/integration.module';
import { OrderPrismaRepository } from './order.prisma-repository';
import { OrderRepository } from './order.repository';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ClientsModule, IntegrationModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: OrderRepository, useClass: OrderPrismaRepository },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
