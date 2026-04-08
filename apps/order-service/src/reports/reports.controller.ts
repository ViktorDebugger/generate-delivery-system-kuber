import { Controller, Get, Header, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DeliveriesReportQueryDto } from './dto/deliveries-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('deliveries.csv')
  @ApiOperation({ summary: 'Звіт доставок (CSV)' })
  @ApiProduces('text/csv')
  @ApiQuery({
    name: 'dateFrom',
    required: true,
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'dateTo',
    required: true,
    example: '2026-12-31T23:59:59.999Z',
  })
  @ApiQuery({ name: 'courierId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  deliveriesCsv(@Query() query: DeliveriesReportQueryDto) {
    return this.reportsService.getDeliveriesReportCsv(query);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Звіт доставок (JSON, агрегати)' })
  @ApiQuery({
    name: 'dateFrom',
    required: true,
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'dateTo',
    required: true,
    example: '2026-12-31T23:59:59.999Z',
  })
  @ApiQuery({ name: 'courierId', required: false })
  @ApiQuery({ name: 'status', required: false })
  deliveries(@Query() query: DeliveriesReportQueryDto) {
    return this.reportsService.getDeliveriesReport(query);
  }
}
