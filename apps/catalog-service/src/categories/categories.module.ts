import { createKeyv } from '@keyv/redis';
import { CacheModule, type CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CatalogCacheConnectivity } from './catalog-cache-connectivity.provider';
import {
  CATEGORY_BY_ID_CACHE_TTL_MS,
  isRedisDisabledFromConfig,
} from './catalog-cache.constants';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryPrismaRepository } from './category.prisma-repository';
import { CategoryRepository } from './category.repository';

function catalogRedisUrl(config: ConfigService): string {
  const host = config.get<string>('REDIS_HOST', 'localhost');
  const port = config.get<string>('REDIS_PORT', '6379');
  const password = config.get<string>('REDIS_PASSWORD')?.trim() ?? '';
  if (password.length > 0) {
    return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  }
  return `redis://${host}:${port}`;
}

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): CacheModuleOptions => {
        if (isRedisDisabledFromConfig(config)) {
          return { ttl: CATEGORY_BY_ID_CACHE_TTL_MS };
        }
        return {
          stores: [
            createKeyv(catalogRedisUrl(config), {
              throwOnConnectError: true,
              connectionTimeout: 10_000,
            }),
          ],
          ttl: CATEGORY_BY_ID_CACHE_TTL_MS,
        };
      },
    }),
  ],
  controllers: [CategoriesController],
  providers: [
    CatalogCacheConnectivity,
    CategoriesService,
    { provide: CategoryRepository, useClass: CategoryPrismaRepository },
  ],
  exports: [CategoriesService, CategoryRepository],
})
export class CategoriesModule {}
