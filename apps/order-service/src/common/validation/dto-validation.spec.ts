import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateClientDto } from '../../clients/dto/create-client.dto';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';
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
  describe('CreateClientDto', () => {
    it('returns no errors for valid plain object', async () => {
      const dto = plainToInstance(CreateClientDto, {
        fullName: 'A',
        email: 'a@b.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('reports multiple violations for invalid client fields', async () => {
      const dto = plainToInstance(CreateClientDto, {
        fullName: '',
        email: 'not-an-email',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(countConstraintViolations(errors)).toBeGreaterThanOrEqual(2);
      const msgs = violationMessages(errors);
      expect(msgs).toContain(ValidationMessages.client.fullNameRequired);
      expect(msgs).toContain(ValidationMessages.client.emailInvalid);
    });
  });

  describe('CreateOrderDto with productIds', () => {
    it('returns no errors for valid order with productIds', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        orderNumber: 'N-1',
        weight: 2,
        senderId: 's1',
        receiverId: 'r1',
        productIds: ['p1', 'p2'],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid order without productIds', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        orderNumber: 'N-1',
        weight: 2,
        senderId: 's1',
        receiverId: 'r1',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('reports violations on root fields', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        orderNumber: '',
        weight: 0,
        senderId: '',
        receiverId: 'r1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(countConstraintViolations(errors)).toBeGreaterThanOrEqual(3);
      const msgs = violationMessages(errors);
      expect(msgs).toContain(ValidationMessages.order.orderNumberRequired);
      expect(msgs).toContain(ValidationMessages.order.weightPositive);
      expect(msgs).toContain(ValidationMessages.order.senderIdRequired);
    });

    it('rejects productIds entry that is not a string', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        orderNumber: 'N',
        weight: 1,
        senderId: 's',
        receiverId: 'r',
        productIds: [1 as unknown as string],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      const msgs = violationMessages(errors);
      expect(msgs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
