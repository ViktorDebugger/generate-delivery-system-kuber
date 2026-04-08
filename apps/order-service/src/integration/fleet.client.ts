import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  mapFleetCourierLookupError,
  mapFleetListAvailableError,
} from './upstream-errors';

type FleetCourierRow = {
  id: string;
  isAvailable: boolean;
};

@Injectable()
export class FleetClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private fleetBaseUrl(): string | undefined {
    const raw = this.config.get<string>('FLEET_SERVICE_URL');
    if (raw === undefined || raw === '') {
      return undefined;
    }
    return raw.replace(/\/$/, '');
  }

  private internalHeaders(): Record<string, string> {
    const k = this.config.get<string>('FLEET_INTERNAL_API_KEY');
    if (k !== undefined && k !== '') {
      return { 'X-Internal-Api-Key': k };
    }
    return {};
  }

  isFleetConfigured(): boolean {
    return this.fleetBaseUrl() !== undefined;
  }

  async requireCourierAssignable(courierId: string): Promise<void> {
    const base = this.fleetBaseUrl();
    if (base === undefined) {
      throw new BadRequestException(
        'FLEET_SERVICE_URL не налаштовано: неможливо перевірити кур’єра',
      );
    }
    try {
      const res = await firstValueFrom(
        this.http.get<FleetCourierRow>(`${base}/api/couriers/${courierId}`),
      );
      if (!res.data.isAvailable) {
        throw new BadRequestException(`Кур'єр з ID ${courierId} недоступний`);
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      mapFleetCourierLookupError(e, courierId);
    }
  }

  async pickAvailableCourierId(): Promise<string | undefined> {
    const base = this.fleetBaseUrl();
    if (base === undefined) {
      return undefined;
    }
    try {
      const res = await firstValueFrom(
        this.http.get<FleetCourierRow[]>(
          `${base}/api/internal/couriers/available`,
          { headers: this.internalHeaders() },
        ),
      );
      const sorted = [...res.data].sort((a, b) => a.id.localeCompare(b.id));
      return sorted[0]?.id;
    } catch (e) {
      mapFleetListAvailableError(e);
    }
  }
}
