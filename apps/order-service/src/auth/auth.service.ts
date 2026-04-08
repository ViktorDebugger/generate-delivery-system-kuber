import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ email, passwordHash });
    return { id: user.id, email: user.email };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string } | null> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return null;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return null;
    }
    return { id: user.id, email: user.email };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { access_token };
  }
}
