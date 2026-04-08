import type {
  DeliveriesReportResponse,
  DeliveryReportFilter,
} from './delivery-report.types';

export abstract class DeliveryReportRepository {
  abstract getDeliveriesReport(
    filter: DeliveryReportFilter,
  ): Promise<DeliveriesReportResponse>;
}
