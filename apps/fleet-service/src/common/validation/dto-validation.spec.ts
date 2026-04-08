import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateCourierDto } from '../../couriers/dto/create-courier.dto';
import { CreateTransportDto } from '../../transports/dto/create-transport.dto';
import { ValidationMessages } from './messages';

function countConstraintViolations(errors: ValidationError[]): number {
  let count = 0;
  for (const err of errors) {
    if (err.constraints) {
      count += Object.keys(err.constraints).length;
    }
    if (err.children && err.children.length > 0) {
      count += countConstraintViolations(err.children);
    }
  }
  return count;
}

function violationMessages(errors: ValidationError[]): string[] {
  const out: string[] = [];
  for (const err of errors) {
    if (err.constraints) {
      out.push(...Object.values(err.constraints));
    }
    if (err.children && err.children.length > 0) {
      out.push(...violationMessages(err.children));
    }
  }
  return out;
}

describe('DTO class-validator (plainToInstance + validate)', () => {
  describe('CreateCourierDto', () => {
    it('returns no errors for valid plain object', async () => {
      const dto = plainToInstance(CreateCourierDto, { name: 'Ivan' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('reports violation for empty name', async () => {
      const dto = plainToInstance(CreateCourierDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      const msgs = violationMessages(errors);
      expect(msgs).toContain(ValidationMessages.courier.nameRequired);
    });
  });

  describe('CreateTransportDto', () => {
    it('returns no errors for valid plain object', async () => {
      const dto = plainToInstance(CreateTransportDto, { name: 'Van' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('reports violation for empty name', async () => {
      const dto = plainToInstance(CreateTransportDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(countConstraintViolations(errors)).toBeGreaterThanOrEqual(1);
      const msgs = violationMessages(errors);
      expect(msgs).toContain(ValidationMessages.transport.nameRequired);
    });
  });
});
