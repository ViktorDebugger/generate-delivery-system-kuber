import { BadRequestException } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common/interfaces/features/pipe-transform.interface';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto';
import { ValidationMessages } from './messages';
import { createGlobalValidationPipe } from './global-validation.pipe';

describe('createGlobalValidationPipe', () => {
  let bodyMetadata: ArgumentMetadata;

  beforeEach(() => {
    bodyMetadata = {
      type: 'body',
      metatype: CreateCategoryDto,
    };
  });

  it('throws BadRequestException with aggregated messages for invalid body', async () => {
    const pipe = createGlobalValidationPipe();

    await expect(pipe.transform({ name: '' }, bodyMetadata)).rejects.toThrow(
      BadRequestException,
    );

    try {
      await pipe.transform({ name: '' }, bodyMetadata);
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
        ValidationMessages.category.nameRequired,
      );
    }
  });

  it('transforms and whitelists valid body', async () => {
    const pipe = createGlobalValidationPipe();

    const result = (await pipe.transform(
      {
        name: 'Books',
        description: 'Fiction',
        unknownField: 'strip-me',
      },
      bodyMetadata,
    )) as CreateCategoryDto;

    expect(result).toEqual({
      name: 'Books',
      description: 'Fiction',
    });
  });
});
