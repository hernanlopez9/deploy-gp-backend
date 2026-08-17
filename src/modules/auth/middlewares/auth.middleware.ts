import type { Request, Response, NextFunction } from 'express';
import jwt, {
  type JsonWebTokenError,
  type TokenExpiredError,
} from 'jsonwebtoken';
import { config } from '../../../shared/config/config';
import { AppError } from '../../../shared/errors/app-error';
import type { JwtPayload, AuthRequest } from '../../../shared/types/auth.types';

/**
 * Middleware que verifica el access_token desde la cookie httpOnly.
 * Adjunta el payload decodificado en `req.user`.
 */
export function verifyAccessToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(
      AppError.unauthorized('Acceso denegado: no se proporcionó token'),
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const payload = jwt.verify(
      token,
      config.JWT_SECRET,
    ) as unknown as JwtPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    if ((error as TokenExpiredError).name === 'TokenExpiredError') {
      return next(
        AppError.unauthorized('Token expirado, por favor renueve su sesión'),
      );
    }
    if ((error as JsonWebTokenError).name === 'JsonWebTokenError') {
      return next(AppError.unauthorized('Token inválido'));
    }
    return next(AppError.unauthorized('Error de autenticación'));
  }
}

/**
 * Middleware opcional que verifica el token pero NO bloquea la petición
 * si no está presente. Útil para endpoints con contenido público y privado.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.access_token;

  if (!token) {
    return next();
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const payload = jwt.verify(
      token,
      config.JWT_SECRET,
    ) as unknown as JwtPayload;
    (req as AuthRequest).user = payload;
  } catch {
    // Si el token es inválido, simplemente continuamos sin usuario
  }

  next();
}
