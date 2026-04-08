import { Module } from '@nestjs/common';
import { ClientPrismaRepository } from './client.prisma-repository';
import { ClientRepository } from './client.repository';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  controllers: [ClientsController],
  providers: [
    ClientsService,
    { provide: ClientRepository, useClass: ClientPrismaRepository },
  ],
  exports: [ClientsService, ClientRepository],
})
export class ClientsModule {}
