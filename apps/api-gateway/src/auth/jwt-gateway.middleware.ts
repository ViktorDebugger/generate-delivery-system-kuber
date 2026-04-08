import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

function requestPathname(req: Request): string {
  try {
    return new URL(req.originalUrl, 'http://localhost').pathname;
  } catch {
    return typeof req.path === 'string' && req.path.length > 0 ? req.path : '/';
  }
}

function isProtectedApiPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/catalog') ||
    pathname.startsWith('/api/fleet') ||
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/clients') ||
    pathname.startsWith('/api/reports')
  );
}

function extractBearer(req: Request): string | undefined {
  const raw = req.headers.authorization;
  if (typeof raw !== 'string' || !raw.startsWith('Bearer ')) {
    return undefined;
  }
  const token = raw.slice('Bearer '.length).trim();
  return token.length > 0 ? token : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createJwtGatewayMiddleware(
  secret: string,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }
    if (!isProtectedApiPath(requestPathname(req))) {
      next();
      return;
    }
    const token = extractBearer(req);
    if (token === undefined) {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
      return;
    }
    try {
      const rawVerified: unknown = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      });
      if (typeof rawVerified === 'string' || !isRecord(rawVerified)) {
        res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
        return;
      }
      const sub = rawVerified['sub'];
      const email = rawVerified['email'];
      if (
        typeof sub !== 'string' ||
        sub.length === 0 ||
        typeof email !== 'string'
      ) {
        res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
        return;
      }
    } catch {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
      return;
    }
    next();
  };
}
