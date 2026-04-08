import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('INTERNAL_API_KEY');
    if (expected === undefined || expected === '') {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-internal-api-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
    if (typeof key !== 'string' || key !== expected) {
      throw new UnauthorizedException('Невірний або відсутній X-Internal-Api-Key');
    }
    return true;
  }
}
