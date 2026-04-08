import { Max, Min, IsNumber, IsOptional, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateCourierLocationDto {
  @IsNumber({}, { message: ValidationMessages.typeNumber })
  @Min(-90, { message: ValidationMessages.location.latitudeRange })
  @Max(90, { message: ValidationMessages.location.latitudeRange })
  latitude!: number;

  @IsNumber({}, { message: ValidationMessages.typeNumber })
  @Min(-180, { message: ValidationMessages.location.longitudeRange })
  @Max(180, { message: ValidationMessages.location.longitudeRange })
  longitude!: number;

  @IsOptional()
  @IsString({ message: ValidationMessages.location.orderIdString })
  orderId?: string;
}
