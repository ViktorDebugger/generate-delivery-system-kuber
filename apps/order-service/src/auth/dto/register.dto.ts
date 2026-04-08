import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class RegisterDto {
  @IsEmail({}, { message: ValidationMessages.client.emailInvalid })
  email!: string;

  @IsNotEmpty({ message: ValidationMessages.auth.passwordRequired })
  @IsString({ message: ValidationMessages.auth.passwordString })
  @MinLength(8, { message: ValidationMessages.auth.passwordMinLength })
  password!: string;
}
