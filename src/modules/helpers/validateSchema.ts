import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { AppError } from '../../shared/errors/app-error.js'; // Ajusta la ruta a tu AppError

export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Tomamos los datos de la fuente correcta (query, body o params)
      const dataToValidate = req[source];

      // 2. Validamos con Zod (esto aplica los valores por defecto como page: 1)
      const validatedData = schema.parse(dataToValidate);

      // 3. Lo guardamos en req.validatedQuery, req.validatedBody, etc.
      const key = `validated${source.charAt(0).toUpperCase() + source.slice(1)}`;
      (req as any)[key] = validatedData;

      next();
    } catch (error: unknown) {
      // 4. Manejo limpio de errores de Zod
      if (error instanceof Error && 'errors' in (error as any)) {
        const zodError = error as ZodError;
        const messages = zodError.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new AppError(messages, 400));
      } else {
        next(
          new AppError(
            error instanceof Error ? error.message : 'Error de validación',
            400,
          ),
        );
      }
    }
  };
};
