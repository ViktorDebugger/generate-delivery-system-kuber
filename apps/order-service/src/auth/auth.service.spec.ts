import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const usersFindByEmail = jest.fn();
  const usersCreate = jest.fn();
  const jwtSignAsync = jest.fn();

  beforeEach(async () => {
    jwtSignAsync.mockReset();
    usersFindByEmail.mockReset();
    usersCreate.mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: usersFindByEmail,
            create: usersCreate,
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jwtSignAsync },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when email exists', async () => {
      usersFindByEmail.mockResolvedValue({
        id: 'u0',
        email: 'taken@b.c',
        passwordHash: 'x',
        createdAt: new Date(),
      });
      await expect(
        service.register('taken@b.c', 'password12'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersCreate).not.toHaveBeenCalled();
    });

    it('creates user and returns id and email', async () => {
      usersFindByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersCreate.mockResolvedValue({
        id: 'new-id',
        email: 'new@b.c',
        passwordHash: 'hashed',
        createdAt: new Date(),
      });
      await expect(service.register('new@b.c', 'password12')).resolves.toEqual({
        id: 'new-id',
        email: 'new@b.c',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password12', 10);
      expect(usersCreate).toHaveBeenCalledWith({
        email: 'new@b.c',
        passwordHash: 'hashed',
      });
    });

    it('propagates ConflictException from UsersService.create', async () => {
      usersFindByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersCreate.mockRejectedValue(new ConflictException());
      await expect(
        service.register('race@b.c', 'password12'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('returns null when user is missing', async () => {
      usersFindByEmail.mockResolvedValue(null);
      await expect(service.validateUser('a@b.c', 'secret')).resolves.toBeNull();
    });

    it('returns null when password does not match', async () => {
      usersFindByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        passwordHash: 'hash',
        createdAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.validateUser('a@b.c', 'wrong')).resolves.toBeNull();
    });

    it('returns id and email when password matches', async () => {
      usersFindByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        passwordHash: 'hash',
        createdAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.validateUser('a@b.c', 'ok')).resolves.toEqual({
        id: 'u1',
        email: 'a@b.c',
      });
    });

    it('calls bcrypt.compare with password and stored hash', async () => {
      usersFindByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        passwordHash: 'stored-hash',
        createdAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await service.validateUser('a@b.c', 'plain-secret');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-secret',
        'stored-hash',
      );
    });

    it('does not call bcrypt.compare when user is missing', async () => {
      usersFindByEmail.mockResolvedValue(null);
      await service.validateUser('missing@b.c', 'x');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when validateUser fails', async () => {
      usersFindByEmail.mockResolvedValue(null);
      await expect(service.login('a@b.c', 'x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns access_token with JWT', async () => {
      usersFindByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        passwordHash: 'hash',
        createdAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtSignAsync.mockResolvedValue('jwt-token');
      await expect(service.login('a@b.c', 'ok')).resolves.toEqual({
        access_token: 'jwt-token',
      });
      expect(jwtSignAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.c',
      });
    });
  });
});
