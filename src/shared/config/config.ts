import 'dotenv/config';
import { OPTIONAL_VARS, REQUIRED_VARS } from '../valueObjects';
// import { OPTIONAL_VARS, REQUIRED_VARS } from '@/domain/valueObjects';
// ! ─── Variables requeridas (la app no arranca sin estas) ───────────────────────

const missing = REQUIRED_VARS.filter((key: string) => !process.env[key]);
// lo que verica es que faltan las variables requeridas
if (missing.length > 0) {
  console.error('\n\x1b[31m╔══════════════════════════════════════════════╗');
  console.error('║   ❌  VARIABLES DE ENTORNO FALTANTES         ║');
  console.error('╠══════════════════════════════════════════════╣');
  missing.forEach((key: string) => {
    console.error(`║   • ${key.padEnd(42)}║`);
  });
  console.error('╠══════════════════════════════════════════════╣');
  console.error('║   Revisa tu archivo .env                     ║');
  console.error('╚══════════════════════════════════════════════╝\x1b[0m\n');
  process.exit(1);
}

const missingOptional = OPTIONAL_VARS.filter((key) => !process.env[key]);

if (missingOptional.length > 0) {
  console.warn('\n\x1b[33m⚠  Variables opcionales no definidas:\x1b[0m');
  missingOptional.forEach((key) => {
    console.warn(`   • ${key} — algunas funciones pueden no estar disponibles`);
  });
  console.warn('');
}

// ─── Config exportada ─────────────────────────────────────────────────────────
export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  autoSetup: process.env.AUTO_SETUP === 'true',
  URL: process.env.URL || 'http://localhost:3000',
  HOST: process.env.HOST || 'localhost',
  JWT_SECRET: process.env.JWT_SECRET!,

  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,
  CORS_ORIGIN: process.env.CORS_ORIGIN!,
  REFRESH_SECRET: process.env.REFRESH_SECRET!,
  //   GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID!,
  //   GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET!,
  //   GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI!,
  //   GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN!,
};
