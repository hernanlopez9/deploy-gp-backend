import { Server } from './app';
import { config } from './shared/config/config';

let server: Server;

function bootstrap(): Server {
  try {
    console.info('🚀 Inicializando servidor...');
    server = new Server(config.port);
    server.start();
    console.info(`✅ Servidor corriendo en el puerto ${config.port}`);
    return server;
  } catch (error) {
    console.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
}

// function shutdown(signal: string) {
//   console.info(`\n🛑 Señal ${signal} recibida, cerrando servidor...`);
//   if (server && typeof (server as any).stop === 'function') {
//     (server as any)
//       .stop()
//       .then(() => {
//         console.info('👋 Servidor cerrado correctamente');
//         process.exit(0);
//       })
//       .catch((err: unknown) => {
//         console.error('⚠️ Error cerrando servidor:', err);
//         process.exit(1);
//       });
//   } else {
//     process.exit(0);
//   }
// }

// process.on('SIGINT', () => shutdown('SIGINT'));
// process.on('SIGTERM', () => shutdown('SIGTERM'));

// process.on('unhandledRejection', (reason) => {
//   console.error('💥 Promesa rechazada sin manejar:', reason);
//   process.exit(1);
// });

// process.on('uncaughtException', (error) => {
//   console.error('💥 Excepción no capturada:', error);
//   process.exit(1);
// });

bootstrap();
