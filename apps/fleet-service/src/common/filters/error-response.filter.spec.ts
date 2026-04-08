import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponseBody } from './error-response.body';
import { ErrorResponseFilter } from './error-response.filter';

describe('ErrorResponseFilter', () => {
  let filter: ErrorResponseFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let mockResponse: Response;
  let mockRequest: Request;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ErrorResponseFilter();
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
    mockRequest = {
      originalUrl: '/api/clients/abc',
      url: '/api/clients/abc',
    } as Request;
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: (): Response => mockResponse,
        getRequest: (): Request => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  function firstJsonPayload(): ErrorResponseBody {
    const calls = jsonMock.mock.calls as Array<[ErrorResponseBody]>;
    const row = calls[0];
    if (row === undefined) {
      throw new Error('json not called');
    }
    return row[0];
  }

  it('serializes HttpException 404 using originalUrl', () => {
    filter.catch(new NotFoundException('missing'), mockHost);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledTimes(1);
    const body = firstJsonPayload();
    expect(body.status).toBe(404);
    expect(body.message).toBe('missing');
    expect(body.path).toBe('/api/clients/abc');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('serializes HttpException 400 with object response message', () => {
    filter.catch(
      new BadRequestException({ message: 'validation failed' }),
      mockHost,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    const body = firstJsonPayload();
    expect(body.status).toBe(400);
    expect(body.message).toBe('validation failed');
    expect(body.path).toBe('/api/clients/abc');
  });

  it('uses request.url when originalUrl is missing', () => {
    mockRequest = { url: '/fallback/path' } as Request;
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: (): Response => mockResponse,
        getRequest: (): Request => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new NotFoundException('x'), mockHost);

    expect(firstJsonPayload().path).toBe('/fallback/path');
  });

  it('serializes unknown exception as 500', () => {
    filter.catch(new Error('boom'), mockHost);

    expect(statusMock).toHaveBeenCalledWith(500);
    const body = firstJsonPayload();
    expect(body.status).toBe(500);
    expect(body.message).toBe('Виникла внутрішня помилка сервера');
    expect(body.path).toBe('/api/clients/abc');
  });
});
