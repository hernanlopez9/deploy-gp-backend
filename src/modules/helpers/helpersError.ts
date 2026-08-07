import type { Response } from 'express';
import { AppError } from '../../shared/errors/app-error';

export const handleError = (error: unknown, res: Response): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error('[AuthController]', error);

  res.status(500).json({
    message: 'Error interno del servidor',
  });
};
