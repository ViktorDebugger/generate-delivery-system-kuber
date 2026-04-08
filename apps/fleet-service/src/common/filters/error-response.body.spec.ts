import {
  buildErrorResponseBody,
  resolveErrorRequestPath,
} from './error-response.body';

describe('resolveErrorRequestPath', () => {
  it('prefers originalUrl when set', () => {
    expect(
      resolveErrorRequestPath({
        originalUrl: '/api/a?x=1',
        url: '/wrong',
      }),
    ).toBe('/api/a?x=1');
  });

  it('falls back to url', () => {
    expect(resolveErrorRequestPath({ url: '/api/b' })).toBe('/api/b');
  });
});

describe('buildErrorResponseBody', () => {
  it('returns timestamp, status, message, path', () => {
    const before = Date.now();
    const body = buildErrorResponseBody(404, 'not found', '/api/x');
    const after = Date.now();

    expect(body.status).toBe(404);
    expect(body.message).toBe('not found');
    expect(body.path).toBe('/api/x');
    expect(Object.keys(body).sort()).toEqual([
      'message',
      'path',
      'status',
      'timestamp',
    ]);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(Date.parse(body.timestamp)).toBeGreaterThanOrEqual(before - 1);
    expect(Date.parse(body.timestamp)).toBeLessThanOrEqual(after + 1);
  });
});
