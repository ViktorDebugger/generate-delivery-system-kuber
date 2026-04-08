import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiListQueryDocs } from '../common/list-query/api-list-query.decorator';
import { CourierLocationsService } from './courier-locations.service';
import { CouriersService } from './couriers.service';
import { CreateCourierLocationDto } from './dto/create-courier-location.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';

@ApiTags('couriers')
@Controller('couriers')
export class CouriersController {
  constructor(
    private readonly couriersService: CouriersService,
    private readonly courierLocationsService: CourierLocationsService,
  ) {}

  @Get()
  @ApiListQueryDocs()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
    @Query('sort', new DefaultValuePipe('id')) sort: string,
    @Query('order', new DefaultValuePipe('asc')) order: string,
  ) {
    return this.couriersService.findAll(page, size, sort, order);
  }

  @Post(':id/locations')
  @ApiOperation({ summary: 'Записати точку геолокації кур’єра' })
  @ApiParam({ name: 'id', description: "ID кур'єра" })
  @ApiBody({ type: CreateCourierLocationDto })
  @HttpCode(HttpStatus.CREATED)
  async recordLocation(
    @Param('id') id: string,
    @Body() dto: CreateCourierLocationDto,
  ) {
    return this.courierLocationsService.recordLocation(id, dto);
  }

  @Get(':id/locations/latest')
  @ApiOperation({ summary: 'Остання відома точка кур’єра' })
  @ApiParam({ name: 'id', description: "ID кур'єра" })
  async latestLocation(@Param('id') id: string) {
    return this.courierLocationsService.getLatestForCourier(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.couriersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCourierDto) {
    return this.couriersService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourierDto) {
    return this.couriersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.couriersService.remove(id);
  }
}
