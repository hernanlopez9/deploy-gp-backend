import type { Request, Response, Application, RequestHandler } from 'express';
import packageData from '../../../package.json';
import { createCorsMiddleware } from '../../shared/config/cors.config';
import { config } from '../../shared/config/config';
import { authRoutes } from '../auth';
import { dashboardRoutes } from '../dashboard';
import { clientsRouter } from '../clients';
import SalesRouter from '../sales/routes/sales.routes';
import ProductosRouter from '../products/routes/products.routes';
// import { Router } from 'express';
// const router = Router();
// funciones para configurar las rutas de la api, como el health check, la documentación, etc.

export function setupRoutes(
  app: Application,
  corsMiddleware: RequestHandler = createCorsMiddleware(),
): void {
  app.use(corsMiddleware);

  // ✅ CORRECCIÓN AQUÍ: Subir dos niveles para llegar a 'src/apk'
  // Opción A (Relativa):

  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: packageData.name,
      version: packageData.version,
      endpoints: {
        health: '/health',
      },
    });
  });

  app.get('/health', (req: Request, res: Response) => {
    res.json({
      name: packageData.name || 'back-end-adventurewords',
      version: packageData.version || '1.0.0',
      description:
        packageData.description || 'Backend para el sistema de adventurewords',
      node_version: process.version,
      environment: config.env || 'development',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      platform: process.platform,
      architecture: process.arch,
    });
  });

  // ✅ Ahora sí apuntará a la carpeta correcta
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/clients', clientsRouter);
  app.use('/api/products', ProductosRouter);
  app.use('/api/sales', SalesRouter);
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });
}
