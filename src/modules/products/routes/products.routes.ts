import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { validate } from '../../helpers/validateSchema.js'; // Ajusta la ruta si es necesario
import {
  productOptionsQuerySchema,
  productFilterSchema,
} from '../schemas/products.schemas.js';

const router = Router();

// GET /products/options
router.get(
  '/options',
  validate(productOptionsQuerySchema as any),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  productsController.getOptions,
);

// GET /products
// eslint-disable-next-line @typescript-eslint/unbound-method
router.get(
  '/',
  validate(productFilterSchema as any),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  productsController.findAll,
);

export default router;
