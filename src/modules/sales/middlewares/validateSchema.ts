import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../../../shared/errors/app-error';

export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];
      const validatedData = schema.parse(dataToValidate);

      // Adjuntamos los datos limpios y tipados al request
      const key = `validated${source.charAt(0).toUpperCase() + source.slice(1)}`;
      (req as any)[key] = validatedData;
      next();
    } catch (error: any) {
      next(new AppError(error.errors || error.message, 400));
    }
  };
};
