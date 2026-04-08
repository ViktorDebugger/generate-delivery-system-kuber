import { BadRequestException } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common/interfaces/features/pipe-transform.interface';
import { CreateClientDto } from '../../clients/dto/create-client.dto';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';
import { ValidationMessages } from './messages';
import { createGlobalValidationPipe } from './global-validation.pipe';

describe('createGlobalValidationPipe', () => {
  describe('CreateClientDto body', () => {
    let bodyMetadata: ArgumentMetadata;

    beforeEach(() => {
      bodyMetadata = {
        type: 'body',
        metatype: CreateClientDto,
      };
    });

    it('throws BadRequestException with aggregated messages for invalid body', async () => {
      const pipe = createGlobalValidationPipe();

      await expect(
        pipe.transform({ fullName: '', email: 'not-email' }, bodyMetadata),
      ).rejects.toThrow(BadRequestException);

      try {
        await pipe.transform({ fullName: '', email: 'not-email' }, bodyMetadata);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const ex = err as BadRequestException;
        const body = ex.getResponse();
        expect(typeof body).toBe('object');
        expect(body).toMatchObject({
          statusCode: 400,
        });
        const payload = body as { message: string };
        expect(payload.message).toContain(
          ValidationMessages.client.fullNameRequired,
        );
        expect(payload.message).toContain(
          ValidationMessages.client.emailInvalid,
        );
      }
    });

    it('transforms and whitelists valid body', async () => {
      const pipe = createGlobalValidationPipe();

      const result = (await pipe.transform(
        {
          fullName: 'Ivan',
          email: 'ivan@test.com',
          address: 'Kyiv',
          unknownField: 'strip-me',
        },
        bodyMetadata,
      )) as CreateClientDto;

      expect(result).toEqual({
        fullName: 'Ivan',
        email: 'ivan@test.com',
        address: 'Kyiv',
      });
    });
  });

  describe('CreateOrderDto body', () => {
    let bodyMetadata: ArgumentMetadata;

    beforeEach(() => {
      bodyMetadata = {
        type: 'body',
        metatype: CreateOrderDto,
      };
    });

    it('throws BadRequestException for invalid order body', async () => {
      const pipe = createGlobalValidationPipe();

      await expect(
        pipe.transform(
          {
            orderNumber: '',
            weight: 0,
            senderId: 's',
            receiverId: 'r',
          },
          bodyMetadata,
        ),
      ).rejects.toThrow(BadRequestException);

      try {
        await pipe.transform(
          {
            orderNumber: '',
            weight: 0,
            senderId: 's',
            receiverId: 'r',
          },
          bodyMetadata,
        );
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const ex = err as BadRequestException;
        const body = ex.getResponse();
        const payload = body as { message: string };
        expect(payload.message).toContain(
          ValidationMessages.order.orderNumberRequired,
        );
        expect(payload.message).toContain(ValidationMessages.order.weightPositive);
      }
    });
  });
});
