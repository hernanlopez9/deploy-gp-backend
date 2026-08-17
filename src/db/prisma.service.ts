import 'dotenv/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '../../generated/prisma/client';

const adapter = new PrismaMssql({
  server: process.env.DATABASE_SERVER!,
  port: Number(process.env.DATABASE_PORT || 1433),
  database: process.env.DATABASE_NAME!,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});

export const prisma = new PrismaClient({ adapter });
