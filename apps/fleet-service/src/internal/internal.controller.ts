import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CourierLocationsService } from '../couriers/courier-locations.service';
import { CouriersService } from '../couriers/couriers.service';
import { TransportsService } from '../transports/transports.service';
import { InternalApiGuard } from './internal-api.guard';

@ApiTags('internal')
@ApiSecurity('internal-api-key')
@ApiUnauthorizedResponse({
  description: 'Невірний або відсутній ключ (коли INTERNAL_API_KEY задано)',
})
@UseGuards(InternalApiGuard)
@Controller('internal')
export class InternalController {
  constructor(
    private readonly couriersService: CouriersService,
    private readonly courierLocationsService: CourierLocationsService,
    private readonly transportsService: TransportsService,
  ) {}

  @Get('couriers/available')
  @ApiOperation({ summary: 'Список доступних кур’єрів (для order-service)' })
  @ApiResponse({ status: 200, description: 'OK' })
  listAvailableCouriers() {
    return this.couriersService.findAllAvailable();
  }

  @Get('couriers/:id/locations/latest')
  @ApiOperation({ summary: 'Остання відома локація кур’єра' })
  @ApiParam({ name: 'id', description: "ID кур'єра" })
  @ApiResponse({ status: 200, description: 'Локація знайдена' })
  @ApiResponse({ status: 404, description: 'Кур’єр або локації не знайдено' })
  getLatestCourierLocation(@Param('id') id: string) {
    return this.courierLocationsService.getLatestForCourier(id);
  }

  @Get('transports/:id')
  @ApiOperation({ summary: 'Читання транспорту за id' })
  @ApiParam({ name: 'id', description: 'UUID транспорту' })
  @ApiResponse({ status: 200, description: 'Транспорт знайдено' })
  @ApiResponse({ status: 404, description: 'Транспорт не знайдено' })
  getTransport(@Param('id') id: string) {
    return this.transportsService.findOne(id);
  }
}
