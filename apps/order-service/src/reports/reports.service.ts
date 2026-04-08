import { BadRequestException, Injectable } from '@nestjs/common';
import { DeliveryReportRepository } from './delivery-report.repository';
import type {
  DeliveriesReportResponse,
  DeliveryReportFilter,
} from './delivery-report.types';
import { DeliveriesReportQueryDto } from './dto/deliveries-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly deliveryReports: DeliveryReportRepository) {}

  async getDeliveriesReport(
    dto: DeliveriesReportQueryDto,
  ): Promise<DeliveriesReportResponse> {
    const filter = this.parseDeliveriesReportQuery(dto);
    return this.deliveryReports.getDeliveriesReport(filter);
  }

  async getDeliveriesReportCsv(dto: DeliveriesReportQueryDto): Promise<string> {
    const filter = this.parseDeliveriesReportQuery(dto);
    const data = await this.deliveryReports.getDeliveriesReport(filter);
    return this.formatDeliveriesReportCsv(data);
  }

  private parseDeliveriesReportQuery(
    dto: DeliveriesReportQueryDto,
  ): DeliveryReportFilter {
    const dateFrom = new Date(dto.dateFrom);
    const dateTo = new Date(dto.dateTo);
    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      throw new BadRequestException('Некоректний діапазон дат');
    }
    if (dateFrom.getTime() > dateTo.getTime()) {
      throw new BadRequestException('dateFrom не може бути пізніше за dateTo');
    }
    const courierId =
      dto.courierId !== undefined && dto.courierId.trim() !== ''
        ? dto.courierId.trim()
        : undefined;
    const status =
      dto.status !== undefined && dto.status.trim() !== ''
        ? dto.status.trim().toUpperCase()
        : undefined;
    return { dateFrom, dateTo, courierId, status };
  }

  private formatDeliveriesReportCsv(data: DeliveriesReportResponse): string {
    const esc = (v: string): string => {
      if (/[",\n\r]/.test(v)) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };
    const lines: string[] = [];
    lines.push('totalOrders,weightSum,weightAverage');
    lines.push(`${data.totalOrders},${data.weight.sum},${data.weight.average}`);
    lines.push('status,orderCount');
    const statusKeys = Object.keys(data.byStatus).sort((a, b) =>
      a.localeCompare(b),
    );
    for (const k of statusKeys) {
      lines.push(`${esc(k)},${data.byStatus[k]}`);
    }
    lines.push('courierId,courierName,orderCount');
    for (const row of data.byCourier) {
      const id = row.courierId ?? '';
      const name = row.name ?? '';
      lines.push(`${esc(id)},${esc(name)},${row.orderCount}`);
    }
    return `${lines.join('\n')}\n`;
  }
}
