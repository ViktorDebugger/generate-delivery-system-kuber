import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { isRedisDisabledFromConfig } from './catalog-cache.constants';

@Injectable()
export class CatalogCacheConnectivity implements OnModuleInit {
  private readonly logger = new Logger(CatalogCacheConnectivity.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (isRedisDisabledFromConfig(this.config)) {
      this.logger.log(
        'REDIS_DISABLED: catalog cache uses the default in-memory store (no Redis).',
      );
      return;
    }
    try {
      await this.cache.set('catalog:__redis_ping', '1', 2000);
      await this.cache.del('catalog:__redis_ping');
      this.logger.log('Catalog cache: Redis connection OK.');
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      const msg = [
        'catalog-service: Redis is required but not reachable.',
        `Reason: ${detail}`,
        'Fix: run Redis (e.g. docker compose up -d redis) and set REDIS_HOST / REDIS_PORT.',
        'Lab only: set REDIS_DISABLED=true to use in-memory cache (not for production).',
      ].join(' ');
      this.logger.error(msg);
      throw new Error(msg);
    }
  }
}
