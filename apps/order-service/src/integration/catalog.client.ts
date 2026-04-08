import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { mapCatalogProductError } from './upstream-errors';

@Injectable()
export class CatalogClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private baseUrl(): string {
    const raw = this.config.get<string>('CATALOG_SERVICE_URL');
    if (raw === undefined || raw === '') {
      throw new BadRequestException(
        'CATALOG_SERVICE_URL не налаштовано: неможливо перевірити товари',
      );
    }
    return raw.replace(/\/$/, '');
  }

  private internalHeaders(): Record<string, string> {
    const k = this.config.get<string>('CATALOG_INTERNAL_API_KEY');
    if (k !== undefined && k !== '') {
      return { 'X-Internal-Api-Key': k };
    }
    return {};
  }

  async assertProductsExist(productIds: string[]): Promise<void> {
    if (productIds.length === 0) {
      return;
    }
    const base = this.baseUrl();
    const headers = this.internalHeaders();
    for (const productId of productIds) {
      try {
        await firstValueFrom(
          this.http.get(`${base}/api/internal/products/${productId}`, {
            headers,
          }),
        );
      } catch (e) {
        mapCatalogProductError(e, productId);
      }
    }
  }
}
