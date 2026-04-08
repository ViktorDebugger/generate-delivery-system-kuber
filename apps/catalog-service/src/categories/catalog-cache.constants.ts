import type { ConfigService } from '@nestjs/config';

export const CATEGORY_BY_ID_CACHE_TTL_MS = 90_000;

export function isRedisDisabledFromConfig(config: ConfigService): boolean {
  const v = config.get<string>('REDIS_DISABLED', '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function buildCategoryCacheKey(id: string): string {
  return `categories:byId:${id}`;
}
