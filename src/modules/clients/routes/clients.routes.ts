import { Router } from 'express';
import { ClientsController } from '../controllers/clients.controller.js';
import { ClientsService } from '../services/clients.service.js';
import { prisma } from '../../../db/prisma.service.js';

// Inicialización del módulo (Patrón Singleton)
const clientsService = new ClientsService(prisma);
const clientsController = new ClientsController(clientsService);

const router = Router();

router.post('/', clientsController.create);
router.get('/options', clientsController.getOptions);
router.get('/search', clientsController.search);
router.get('/:id/addresses', clientsController.getAddresses);
router.post('/:id/addresses', clientsController.addAddress);
router.get('/:id/orders', clientsController.getOrdersHistory);
router.get('/:id/orders/total', clientsController.getTotalPurchases);

export default router;
