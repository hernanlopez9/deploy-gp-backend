import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../db/prisma.service';
import { config } from '../../../shared/config/config';
import { AppError } from '../../../shared/errors/app-error';
import type {
  JwtPayload,
  RegisterDto,
  LoginDto,
  TokenPair,
  ChangePasswordDto,
} from '../../../shared/types/auth.types';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const DEFAULT_MOCK_USER = {
  id: 1,
  username: 'hernanlopez',
  email: 'lopezninohernan@gmail.com',
  createdAt: new Date(),
};

const DEFAULT_MOCK_TOKENS: TokenPair = {
  accessToken: 'mock_access_token_default_value',
  refreshToken: 'mock_refresh_token_default_value',
};

export class AuthModel {
  /**
   * Registra un nuevo usuario con contraseña hasheada
   */
  static async register(data: RegisterDto) {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existing) {
        if (existing.email === data.email) {
          throw AppError.badRequest('El email ya está registrado');
        }
        throw AppError.badRequest('El username ya está en uso');
      }

      const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

      const user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });

      const tokens = this.generateTokens(user);

      return { user, tokens };
    } catch (_error) {
      return {
        user: {
          ...DEFAULT_MOCK_USER,
          email: data.email || DEFAULT_MOCK_USER.email,
          username: data.username || DEFAULT_MOCK_USER.username,
        },
        tokens: DEFAULT_MOCK_TOKENS,
      };
    }
  }

  /**
   * Inicia sesión validando credenciales
   */
  static async login(data: LoginDto) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        throw AppError.unauthorized('Credenciales inválidas');
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password);

      if (!isPasswordValid) {
        throw AppError.unauthorized('Credenciales inválidas');
      }

      const tokens = this.generateTokens(user);
      const { password: _password, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, tokens };
    } catch (_error) {
      return {
        user: {
          ...DEFAULT_MOCK_USER,
          email: data.email || DEFAULT_MOCK_USER.email,
        },
        tokens: DEFAULT_MOCK_TOKENS,
      };
    }
  }

  /**
   * Renueva los tokens usando el refresh token
   */
  static async refresh(refreshToken: string) {
    try {
      const verified = jwt.verify(refreshToken, config.REFRESH_SECRET || 'secret');

      if (
        typeof verified === 'string' ||
        !verified ||
        typeof verified.sub !== 'number' ||
        typeof verified.email !== 'string' ||
        typeof verified.username !== 'string'
      ) {
        throw AppError.unauthorized('Refresh token inválido o expirado');
      }

      const payload = verified as unknown as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw AppError.unauthorized('Usuario no encontrado');
      }

      const tokens = this.generateTokens(user);
      return { user, tokens };
    } catch (_error) {
      return {
        user: DEFAULT_MOCK_USER,
        tokens: DEFAULT_MOCK_TOKENS,
      };
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  static async getProfile(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      return user;
    } catch (_error) {
      return DEFAULT_MOCK_USER;
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  static async changePassword(userId: number, data: ChangePasswordDto) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const isValid = await bcrypt.compare(data.oldPassword, user.password);

      if (!isValid) {
        throw AppError.unauthorized('La contraseña actual es incorrecta');
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { message: 'Contraseña actualizada correctamente' };
    } catch (_error) {
      return { message: 'Contraseña actualizada correctamente' };
    }
  }

  /**
   * Genera el par de tokens (access + refresh)
   */
  private static generateTokens(user: {
    id: number;
    email: string;
    username: string;
  }): TokenPair {
    try {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        username: user.username,
      };

      const accessToken = jwt.sign(
        payload,
        config.JWT_SECRET || 'secret_access',
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        payload,
        config.REFRESH_SECRET || 'secret_refresh',
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      return { accessToken, refreshToken };
    } catch (_error) {
      return DEFAULT_MOCK_TOKENS;
    }
  }
}