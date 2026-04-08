import { isAxiosError } from 'axios';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';

function rethrowIfHttpException(e: unknown): void {
  if (e instanceof HttpException) {
    throw e;
  }
}

export function mapCatalogProductError(e: unknown, productId: string): never {
  rethrowIfHttpException(e);
  if (isAxiosError(e)) {
    const st = e.response?.status;
    if (st === 404) {
      throw new BadRequestException(`Товар з ID ${productId} не знайдено`);
    }
    if (st === 401 || st === 403) {
      throw new BadGatewayException(
        'Каталог відхилив внутрішній запит (перевірте CATALOG_INTERNAL_API_KEY)',
      );
    }
    if (st === 503 || st === 502 || st === 504) {
      throw new ServiceUnavailableException(
        'Сервіс каталогу тимчасово недоступний',
      );
    }
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
      throw new ServiceUnavailableException(
        'Сервіс каталогу: таймаут з’єднання',
      );
    }
    if (e.response === undefined) {
      throw new ServiceUnavailableException('Сервіс каталогу недоступний');
    }
    throw new BadGatewayException(
      `Каталог повернув помилку ${String(st ?? 'unknown')}`,
    );
  }
  throw new BadGatewayException('Неможливо звернутися до каталогу');
}

export function mapFleetCourierLookupError(
  e: unknown,
  courierId: string,
): never {
  rethrowIfHttpException(e);
  if (isAxiosError(e)) {
    const st = e.response?.status;
    if (st === 404) {
      throw new BadRequestException(`Кур'єр з ID ${courierId} не знайдено`);
    }
    if (st === 503 || st === 502 || st === 504) {
      throw new ServiceUnavailableException(
        'Сервіс fleet тимчасово недоступний',
      );
    }
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
      throw new ServiceUnavailableException('Сервіс fleet: таймаут з’єднання');
    }
    if (e.response === undefined) {
      throw new ServiceUnavailableException('Сервіс fleet недоступний');
    }
    throw new BadGatewayException(
      `Fleet повернув помилку ${String(st ?? 'unknown')}`,
    );
  }
  throw new BadGatewayException('Неможливо звернутися до fleet');
}

export function mapFleetListAvailableError(e: unknown): never {
  rethrowIfHttpException(e);
  if (isAxiosError(e)) {
    const st = e.response?.status;
    if (st === 503 || st === 502 || st === 504) {
      throw new ServiceUnavailableException(
        'Сервіс fleet тимчасово недоступний',
      );
    }
    if (st === 401 || st === 403) {
      throw new BadGatewayException(
        'Fleet відхилив внутрішній запит (перевірте FLEET_INTERNAL_API_KEY)',
      );
    }
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
      throw new ServiceUnavailableException('Сервіс fleet: таймаут з’єднання');
    }
    if (e.response === undefined) {
      throw new ServiceUnavailableException('Сервіс fleet недоступний');
    }
    throw new BadGatewayException(
      `Fleet повернув помилку ${String(st ?? 'unknown')}`,
    );
  }
  throw new BadGatewayException('Неможливо звернутися до fleet');
}
