export interface ErrorResponseBody {
  timestamp: string;
  status: number;
  message: string;
  path: string;
}

export function resolveErrorRequestPath(req: {
  originalUrl?: string;
  url: string;
}): string {
  return req.originalUrl ?? req.url;
}

export function buildErrorResponseBody(
  status: number,
  message: string,
  path: string,
): ErrorResponseBody {
  return {
    timestamp: new Date().toISOString(),
    status,
    message,
    path,
  };
}
