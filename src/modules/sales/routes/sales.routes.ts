import { Router } from 'express';
import { salesController } from '../controllers/sales.controller.js';
import { validate } from '../../helpers/validateSchema.js'; // Asegúrate de importar esto
import {
  salesOrderFilterSchema,
  createSalesOrderSchema,
  salesOrderIdParamSchema,
} from '../schemas/sales.schemas.js';

const router = Router();

// GET /sales?page=1&limit=10&customerId=5
router.get(
  '/',
  validate(salesOrderFilterSchema, 'query'), // 👈 ¡Aquí validamos la query!
  // eslint-disable-next-line @typescript-eslint/unbound-method
  salesController.findAll,
);

// GET /sales/:id
router.get(
  '/:id',
  validate(salesOrderIdParamSchema, 'params'), // 👈 Validamos los params
  // eslint-disable-next-line @typescript-eslint/unbound-method
  salesController.findById,
);

// POST /sales
router.post(
  '/',
  validate(createSalesOrderSchema, 'body'), // 👈 Validamos el body
  // eslint-disable-next-line @typescript-eslint/unbound-method
  salesController.create,
);

export default router;
