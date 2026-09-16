import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { validate } from '../../helpers/validateSchema.js';
import {
  productOptionsQuerySchema,
  productFilterSchema,
} from '../schemas/products.schemas.js';

const router = Router();

// GET /products/options
router.get(
  '/options',
  validate(productOptionsQuerySchema, 'query'), // ✅ 'query' explícito
  productsController.getOptions,
);

// GET /products
router.get(
  '/',
  validate(productFilterSchema, 'query'), // ✅ 'query' explícito
  productsController.findAll,
);

export default router;
