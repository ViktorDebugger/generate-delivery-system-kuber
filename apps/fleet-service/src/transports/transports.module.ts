import { Module } from '@nestjs/common';
import { TransportPrismaRepository } from './transport.prisma-repository';
import { TransportRepository } from './transport.repository';
import { TransportsController } from './transports.controller';
import { TransportsService } from './transports.service';

@Module({
  controllers: [TransportsController],
  providers: [
    TransportsService,
    { provide: TransportRepository, useClass: TransportPrismaRepository },
  ],
  exports: [TransportRepository, TransportsService],
})
export class TransportsModule {}
