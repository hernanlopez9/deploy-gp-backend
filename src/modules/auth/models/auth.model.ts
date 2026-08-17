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

export class AuthModel {
  /**
   * Registra un nuevo usuario con contraseña hasheada
   */
  static async register(data: RegisterDto) {
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
  }

  /**
   * Inicia sesión validando credenciales
   */
  static async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Mensaje genérico para no revelar si el email existe
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const tokens = this.generateTokens(user);

    const { password: _password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Renueva los tokens usando el refresh token
   */
  static async refresh(refreshToken: string) {
    try {
      const verified = jwt.verify(refreshToken, config.REFRESH_SECRET);

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
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  static async getProfile(userId: number) {
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
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  static async changePassword(userId: number, data: ChangePasswordDto) {
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
  }

  /**
   * Genera el par de tokens (access + refresh)
   */
  private static generateTokens(user: {
    id: number;
    email: string;
    username: string;
  }): TokenPair {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, config.REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }
}
