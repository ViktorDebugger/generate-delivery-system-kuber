import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateCourierDto {
  @IsNotEmpty({ message: ValidationMessages.courier.nameRequired })
  @IsString({ message: ValidationMessages.courier.nameString })
  name!: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.courier.transportIdString })
  transportId?: string;

  @IsOptional()
  @IsBoolean({ message: ValidationMessages.typeBoolean })
  isAvailable?: boolean;
}
