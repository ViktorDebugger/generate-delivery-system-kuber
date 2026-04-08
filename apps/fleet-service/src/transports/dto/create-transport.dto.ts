import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateTransportDto {
  @IsNotEmpty({ message: ValidationMessages.transport.nameRequired })
  @IsString({ message: ValidationMessages.transport.nameString })
  name!: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.transport.descriptionString })
  description?: string;
}
