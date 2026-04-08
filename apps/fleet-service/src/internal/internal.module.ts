import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { TransportsModule } from '../transports/transports.module';
import { InternalApiGuard } from './internal-api.guard';
import { InternalController } from './internal.controller';

@Module({
  imports: [CouriersModule, TransportsModule],
  controllers: [InternalController],
  providers: [InternalApiGuard],
})
export class InternalModule {}
