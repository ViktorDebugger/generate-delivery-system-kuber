import type { Application, Request } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export type ProxyTargets = {
  catalogUrl: string;
  fleetUrl: string;
  orderUrl: string;
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function catalogPathRewrite(path: string): string {
  const normalized = path === '' || path === '/' ? '' : path;
  return `/api${normalized}`;
}

const forwardProxyOptions = {
  changeOrigin: true,
  xfwd: true,
} as const;

export function registerProxies(
  expressApp: Application,
  targets: ProxyTargets,
): void {
  const catalogTarget = stripTrailingSlash(targets.catalogUrl);
  const fleetTarget = stripTrailingSlash(targets.fleetUrl);
  const orderTarget = stripTrailingSlash(targets.orderUrl);

  expressApp.use(
    '/api/catalog',
    createProxyMiddleware<Request>({
      ...forwardProxyOptions,
      target: catalogTarget,
      pathRewrite: (path) => catalogPathRewrite(path),
    }),
  );

  expressApp.use(
    '/api/fleet',
    createProxyMiddleware<Request>({
      ...forwardProxyOptions,
      target: fleetTarget,
      pathRewrite: (path) => catalogPathRewrite(path),
    }),
  );

  expressApp.use(
    createProxyMiddleware<Request>({
      ...forwardProxyOptions,
      target: orderTarget,
      pathFilter: (pathname: string) =>
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/orders') ||
        pathname.startsWith('/api/clients') ||
        pathname.startsWith('/api/reports'),
    }),
  );
}
