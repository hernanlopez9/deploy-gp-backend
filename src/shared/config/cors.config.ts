// src/infrastructure/config/cors.config.ts
import cors, { type CorsOptions } from 'cors';
import type { RequestHandler } from 'express';

import { config } from './config';
import { ALLOWED_HEADERS, ALLOWED_METHODS } from '../valueObjects';

const origenesPermitidos = (config.CORS_ORIGIN ?? '')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin:
    origenesPermitidos.length > 1 ? origenesPermitidos : origenesPermitidos[0],
  credentials: true,
  methods: [...ALLOWED_METHODS],
  allowedHeaders: [...ALLOWED_HEADERS],
};

export function createCorsMiddleware(): RequestHandler {
  return cors(corsOptions);
}
