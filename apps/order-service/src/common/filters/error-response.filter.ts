import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  buildErrorResponseBody,
  resolveErrorRequestPath,
} from './error-response.body';

type ErrorPayload = {
  message?: string | string[];
};

function httpExceptionMessage(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'string') {
    return body;
  }
  const payload = body as ErrorPayload;
  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  return exception.message;
}

@Catch()
export class ErrorResponseFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = resolveErrorRequestPath(request);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = httpExceptionMessage(exception);
      response
        .status(status)
        .json(buildErrorResponseBody(status, message, path));
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = 'Виникла внутрішня помилка сервера';
    response.status(status).json(buildErrorResponseBody(status, message, path));
  }
}
