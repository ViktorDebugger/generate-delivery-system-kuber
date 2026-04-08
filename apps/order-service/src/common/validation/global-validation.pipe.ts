import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function flattenValidationMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  const walk = (items: ValidationError[]): void => {
    for (const err of items) {
      if (err.constraints) {
        for (const msg of Object.values(err.constraints)) {
          messages.push(msg);
        }
      }
      if (err.children && err.children.length > 0) {
        walk(err.children);
      }
    }
  };
  walk(errors);
  return messages;
}

export function createGlobalValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      const msgs = flattenValidationMessages(errors);
      return new BadRequestException(
        msgs.length > 0 ? msgs.join(', ') : 'Помилка валідації',
      );
    },
  });
}
