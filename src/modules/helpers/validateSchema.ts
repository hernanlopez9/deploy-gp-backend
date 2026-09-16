import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/app-error.js';

export const validate = (
  // ✅ Aceptamos cualquier schema (Joi o Zod)
  schema: any,
  source: 'body' | 'query' | 'params' = 'body',
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];

      let validatedData: any;

      // 🔍 Detectamos si es un schema de Joi
      if (schema && typeof schema.validate === 'function') {
        const { error, value } = schema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true,
          convert: true, // ← importante para que "10" (string) se convierta a 10 (número)
        });

        if (error) {
          const messages = error.details
            .map((d: any) => `${d.path.join('.')}: ${d.message}`)
            .join(', ');
          return next(new AppError(messages, 400));
        }

        validatedData = value;
      }
      // 🔍 Detectamos si es un schema de Zod
      else if (schema && typeof schema.parse === 'function') {
        validatedData = schema.parse(dataToValidate);
      }
      // ❌ Ni Joi ni Zod → error claro
      else {
        return next(
          new AppError(
            'Schema inválido: no tiene ni .validate() (Joi) ni .parse() (Zod)',
            500,
          ),
        );
      }

      // Guardamos los datos validados (req.validatedQuery, req.validatedBody, etc.)
      const key = `validated${source.charAt(0).toUpperCase() + source.slice(1)}`;
      (req as any)[key] = validatedData;

      next();
    } catch (error: unknown) {
      // Manejo de errores de Zod
      if (error instanceof Error && 'issues' in (error as any)) {
        const messages = (error as any).issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return next(new AppError(messages, 400));
      }

      // Manejo genérico
      next(
        new AppError(
          error instanceof Error ? error.message : 'Error de validación',
          400,
        ),
      );
    }
  };
};
