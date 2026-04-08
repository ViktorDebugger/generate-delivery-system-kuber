import { Module } from '@nestjs/common';
import { DeliveryReportPrismaRepository } from './delivery-report.prisma-repository';
import { DeliveryReportRepository } from './delivery-report.repository';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: DeliveryReportRepository,
      useClass: DeliveryReportPrismaRepository,
    },
  ],
})
export class ReportsModule {}
