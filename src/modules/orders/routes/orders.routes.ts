import { Router } from 'express';

import { ordersController } from '../controllers/orders.controllers.js';

import { validate } from '../../helpers/validateSchema.js';

import {
  ordersFilterSchema,
  createOrderSchema,
  updateOrderSchema,
  orderIdParamSchema,
} from '../schemas/orders.schemas.js';

const router = Router();

// Obtener todas las órdenes con paginación y filtros
router.get(
  '/',
  validate(ordersFilterSchema, 'query'),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  ordersController.findAll,
);

// Obtener una orden específica
router.get(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  ordersController.findById,
);

// Crear una nueva orden
router.post(
  '/',
  validate(createOrderSchema, 'body'),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  ordersController.create,
);

// Actualizar una orden
router.patch(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderSchema, 'body'),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  ordersController.update,
);

// Eliminar una orden
router.delete(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  ordersController.remove,
);

export default router;
