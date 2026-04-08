import { Module } from '@nestjs/common';
import { TransportsModule } from '../transports/transports.module';
import { CourierLocationPrismaRepository } from './courier-location.prisma-repository';
import { CourierLocationRepository } from './courier-location.repository';
import { CourierPrismaRepository } from './courier.prisma-repository';
import { CourierRepository } from './courier.repository';
import { CourierLocationsService } from './courier-locations.service';
import { CouriersController } from './couriers.controller';
import { CouriersService } from './couriers.service';

@Module({
  imports: [TransportsModule],
  controllers: [CouriersController],
  providers: [
    CouriersService,
    CourierLocationsService,
    { provide: CourierRepository, useClass: CourierPrismaRepository },
    {
      provide: CourierLocationRepository,
      useClass: CourierLocationPrismaRepository,
    },
  ],
  exports: [CourierRepository, CourierLocationsService, CouriersService],
})
export class CouriersModule {}
