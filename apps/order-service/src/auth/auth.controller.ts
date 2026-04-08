import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'Логін',
    description: 'Без JWT. Повертає access_token для Authorization: Bearer',
  })
  @ApiOkResponse({
    description: 'access_token',
    schema: {
      type: 'object',
      properties: { access_token: { type: 'string' } },
    },
  })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto): Promise<{ access_token: string }> {
    return this.auth.login(body.email, body.password);
  }

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Реєстрація користувача',
    description: 'Без JWT. Далі логін через POST /api/auth/login',
  })
  @ApiCreatedResponse({
    description: 'id та email (без пароля)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto): Promise<{ id: string; email: string }> {
    return this.auth.register(body.email, body.password);
  }
}
