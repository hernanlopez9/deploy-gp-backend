import type { Request, Response, NextFunction } from 'express';
import { AuthModel } from '../models/auth.model';
import { AppError } from '../../../shared/errors/app-error';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../schemas/auth.schemas';
import type { AuthRequest } from '../../../shared/types/auth.types';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = registerSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(AppError.badRequest(messages));
      }

      const result = await AuthModel.register(value);

      AuthController.setTokenCookies(res, result.tokens);

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(AppError.badRequest(messages));
      }

      const result = await AuthModel.login(value);

      AuthController.setTokenCookies(res, result.tokens);

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/logout
   */
  static logout(_req: Request, res: Response) {
    res.clearCookie('access_token', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, maxAge: 0 });

    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  }

  /**
   * POST /auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return next(AppError.unauthorized('No se proporcionó refresh token'));
      }

      const result = await AuthModel.refresh(refreshToken);

      AuthController.setTokenCookies(res, result.tokens);

      return res.status(200).json({
        success: true,
        message: 'Tokens renovados correctamente',
        data: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /auth/profile
   */
  static async profile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sub) {
        return next(AppError.unauthorized('Usuario no autenticado'));
      }

      const user = await AuthModel.getProfile(req.user.sub);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /auth/change-password
   */
  static async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user?.sub) {
        return next(AppError.unauthorized('Usuario no autenticado'));
      }

      const { error, value } = changePasswordSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(AppError.badRequest(messages));
      }

      const result = await AuthModel.changePassword(req.user.sub, value);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Helper: setea las cookies httpOnly con los tokens
   */
  private static setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }
}
