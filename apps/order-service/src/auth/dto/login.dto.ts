import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class LoginDto {
  @IsEmail({}, { message: ValidationMessages.client.emailInvalid })
  email!: string;

  @IsNotEmpty({ message: ValidationMessages.auth.passwordRequired })
  @IsString({ message: ValidationMessages.auth.passwordString })
  password!: string;
}
