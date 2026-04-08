import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CatalogClient } from './catalog.client';
import { FleetClient } from './fleet.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('HTTP_CLIENT_TIMEOUT_MS');
        const timeout =
          raw !== undefined && raw !== '' ? Number.parseInt(raw, 10) : 5000;
        const n = Number.isNaN(timeout) || timeout <= 0 ? 5000 : timeout;
        return {
          timeout: n,
          maxRedirects: 3,
        };
      },
    }),
  ],
  providers: [CatalogClient, FleetClient],
  exports: [CatalogClient, FleetClient],
})
export class IntegrationModule {}
