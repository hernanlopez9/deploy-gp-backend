import express, {
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express';
import cookieParser from 'cookie-parser';
/// funciones para configurar los middlewares de la api, como el body parser, cors, logger, etc

export function setupMiddlewares(app: Application): void {
  // Seguridad
  // CORS
  // !!  IMPORTAR SOLO EL INDEX DE RUTAS (centralizado) // pero no me lo solicitaron :P
  // this.app.use(
  // 	cors({
  // 		origin: process.env.CORS_ORIGIN || "*",
  // 		credentials: true,
  // 	}),
  // );
  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Cookie parser - pars que otra pagina se coman mis galleta
  app.use(cookieParser());
  // Logger de requests o que se muestra en consola
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.info(
        `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`,
      );
    });
    next();
  });
}
