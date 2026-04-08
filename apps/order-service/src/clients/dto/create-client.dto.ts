import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Max,
  Min,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateClientDto {
  @IsNotEmpty({ message: ValidationMessages.client.fullNameRequired })
  @IsString({ message: ValidationMessages.client.fullNameString })
  fullName!: string;

  @IsEmail({}, { message: ValidationMessages.client.emailInvalid })
  email!: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.client.addressString })
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: ValidationMessages.typeNumber })
  @Min(-90, { message: ValidationMessages.location.latitudeRange })
  @Max(90, { message: ValidationMessages.location.latitudeRange })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: ValidationMessages.typeNumber })
  @Min(-180, { message: ValidationMessages.location.longitudeRange })
  @Max(180, { message: ValidationMessages.location.longitudeRange })
  longitude?: number;
}
