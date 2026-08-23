import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js'; // Ajusta la ruta si es necesario
import { PrismaMssql } from '@prisma/adapter-mssql';

// 1. Configuramos el adaptador de SQL Server
const adapter = new PrismaMssql({
  server: process.env.DATABASE_SERVER || 'localhost',
  port: Number(process.env.DATABASE_PORT || 1433),
  database: process.env.DATABASE_NAME || 'AdventureWorks',
  user: process.env.DATABASE_USER || 'sa',
  password: process.env.DATABASE_PASSWORD || '',
  options: {
    encrypt: false, // Cambia a true si usas Azure SQL o requieres encriptación
    trustServerCertificate: true,
  },
});

// 2. Exportamos una ÚNICA instancia (Singleton) que ya incluye el adaptador
export const prisma = new PrismaClient({
  adapter,
  // Opcional: descomenta para ver las consultas en consola durante el desarrollo
  // log: ['query', 'info', 'warn', 'error'],
});
