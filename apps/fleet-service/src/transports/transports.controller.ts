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
import { ApiTags } from '@nestjs/swagger';
import { ApiListQueryDocs } from '../common/list-query/api-list-query.decorator';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { TransportsService } from './transports.service';

@ApiTags('transports')
@Controller('transports')
export class TransportsController {
  constructor(private readonly transportsService: TransportsService) {}

  @Get()
  @ApiListQueryDocs()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
    @Query('sort', new DefaultValuePipe('id')) sort: string,
    @Query('order', new DefaultValuePipe('asc')) order: string,
  ) {
    return this.transportsService.findAll(page, size, sort, order);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transportsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTransportDto) {
    return this.transportsService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTransportDto) {
    return this.transportsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.transportsService.remove(id);
  }
}
