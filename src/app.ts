import express from 'express';

import { config } from './shared/config/config';
import { setupMiddlewares } from './modules/middlewares/configMiddlewares';
import { setupRoutes } from './modules/router/route';
import { printServerInfo } from './shared/utils/Getnetwork';
import { ConfiguracionErrorHandlers } from './modules/helpers/ConfiguracionErrorHandlers';
//  IMPORTAR SOLO EL INDEX DE RUTAS (centralizado)
// import apiRoutes from "./routes/index.routes";
// import swaggerDocument from "./utils/swagger.json";
// import swaggerUI from "swagger-ui-express";
/**Escogia programacion oriendta a objetos para el servidor por que
 * la vi mas funcionar para este proseso :D, tambien siguiendo los principios de de SOLID el de responsavilidad unica
 * esta clase solo inicializa el servervidor consus funciones importes como la configura, los middleware y las turas,  y nada mas,
 */
export class Server {
  private app: express.Application;
  private port: number;
  private server: string | undefined;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.server = config.env === 'development' ? 'localhost' : config.HOST;
    setupMiddlewares(this.app);
    setupRoutes(this.app);
    ConfiguracionErrorHandlers(this.app);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      printServerInfo(this.port);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default Server;
