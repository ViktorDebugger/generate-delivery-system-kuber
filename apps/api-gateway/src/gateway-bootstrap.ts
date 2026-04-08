import type { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { createJwtGatewayMiddleware } from './auth/jwt-gateway.middleware';
import { AppModule } from './app.module';
import { registerProxies, type ProxyTargets } from './proxy/register-proxies';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

function readProxyTargetsFromEnv(): ProxyTargets {
  return {
    catalogUrl: requireEnv('CATALOG_SERVICE_URL'),
    fleetUrl: requireEnv('FLEET_SERVICE_URL'),
    orderUrl: requireEnv('ORDER_SERVICE_URL'),
  };
}

export async function createGatewayApplication(
  nestOptions?: NestApplicationOptions,
): Promise<INestApplication> {
  const expressApp = express();
  const requireJwt = process.env['GATEWAY_REQUIRE_JWT'] !== 'false';
  if (requireJwt) {
    expressApp.use(createJwtGatewayMiddleware(requireEnv('JWT_SECRET')));
  }
  registerProxies(expressApp, readProxyTargetsFromEnv());
  return NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    nestOptions,
  );
}
