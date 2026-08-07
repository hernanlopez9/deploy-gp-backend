import {
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express';
import { config } from '../../shared/config/config';

// fun|ciones para configurar los middlewares de la api, como el body parser, cors, logger, etc.
export function ConfiguracionErrorHandlers(app: Application): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error en request:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        config.env === 'development'
          ? err.message
          : 'Algo salió mal, por favor intente nuevamente más tarde. ',
    });
  });
}
