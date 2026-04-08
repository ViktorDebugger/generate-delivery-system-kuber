import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateCategoryDto {
  @IsNotEmpty({ message: ValidationMessages.category.nameRequired })
  @IsString({ message: ValidationMessages.category.nameString })
  name!: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.category.descriptionString })
  description?: string;
}
