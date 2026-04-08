import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateProductDto {
  @IsNotEmpty({ message: ValidationMessages.product.nameRequired })
  @IsString({ message: ValidationMessages.product.nameString })
  name!: string;

  @IsNumber({}, { message: ValidationMessages.typeNumber })
  @IsPositive({ message: ValidationMessages.product.pricePositive })
  price!: number;

  @IsOptional()
  @IsString({ message: ValidationMessages.product.categoryIdString })
  categoryId?: string;
}
