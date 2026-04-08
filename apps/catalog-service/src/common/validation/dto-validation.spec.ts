import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto';
import { CreateProductDto } from '../../products/dto/create-product.dto';
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
  describe('CreateCategoryDto', () => {
    it('returns no errors for valid plain object', async () => {
      const dto = plainToInstance(CreateCategoryDto, { name: 'Books' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('reports violation for empty name', async () => {
      const dto = plainToInstance(CreateCategoryDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      const msgs = violationMessages(errors);
      expect(msgs).toContain(ValidationMessages.category.nameRequired);
    });
  });

  describe('CreateProductDto', () => {
    it('returns no errors for valid plain object', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Box',
        price: 10,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('reports violations for invalid product fields', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: '',
        price: -5,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(countConstraintViolations(errors)).toBeGreaterThanOrEqual(2);
      const msgs = violationMessages(errors);
      expect(msgs).toContain(ValidationMessages.product.nameRequired);
      expect(msgs).toContain(ValidationMessages.product.pricePositive);
    });
  });
});
