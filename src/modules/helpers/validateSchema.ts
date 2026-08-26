import type { Request, Response, NextFunction } from 'express';
import type { ObjectSchema } from 'joi';
import { AppError } from '../../shared/errors/app-error.js';

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(AppError.badRequest(errorMessage));
    }

    // Adjuntamos los datos limpios y tipados al request
    req.validatedQuery = value;
    next();
  };
};

// Extensión de tipos de Express para incluir validatedQuery
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}
