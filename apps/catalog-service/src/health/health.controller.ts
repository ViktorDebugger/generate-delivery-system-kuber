import { Controller, Get, NotFoundException } from '@nestjs/common';
import { hostname } from 'node:os';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('dev/pod-identity')
  podIdentity() {
    if (process.env.DEV_POD_IDENTITY !== 'true') {
      throw new NotFoundException();
    }
    return { hostname: hostname(), service: 'catalog-service' };
  }
}
