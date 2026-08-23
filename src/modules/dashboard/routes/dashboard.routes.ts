import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { DashboardService } from '../services/dashboard.service.js';
import { prisma } from '../../../db/prisma.service.js'; // <-- Importamos la instancia configurada

// Inicialización del módulo (Singleton)
// Pasamos 'prismaService' que YA tiene el adaptador de MSSQL inyectado
const dashboardService = new DashboardService(prisma);
const dashboardController = new DashboardController(dashboardService);

const router = Router();

router.get('/sales-summary', dashboardController.getSalesSummary);
router.get('/orders-count', dashboardController.getOrdersCount);
router.get('/active-customers', dashboardController.getActiveCustomers);
router.get('/top-seller', dashboardController.getTopSeller);

export default router;
