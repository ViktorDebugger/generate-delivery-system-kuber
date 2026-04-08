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
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiOrdersListQueryDocs } from '../common/list-query/api-list-query-orders.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOrdersListQueryDocs()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
    @Query('sort', new DefaultValuePipe('id')) sort: string,
    @Query('order', new DefaultValuePipe('asc')) order: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(status, page, size, sort, order);
  }

  @Get(':id/with-sender')
  async findOneWithSender(@Param('id') id: string) {
    return this.ordersService.findOneWithSender(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Зміна статусу замовлення (переходи за правилами домену)',
  })
  @ApiParam({ name: 'id', description: 'ID замовлення' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}
