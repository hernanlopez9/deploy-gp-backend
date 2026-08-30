import type { Request, Response, NextFunction } from 'express';
import { salesService } from '../models/sales.service.js'; // O la ruta donde lo tengas

export class SalesController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      // Leemos directamente de req.query y convertimos a números donde sea necesario
      const filter = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        customerId: req.query.customerId
          ? Number(req.query.customerId)
          : undefined,
        territoryId: req.query.territoryId
          ? Number(req.query.territoryId)
          : undefined,
        status: req.query.status ? Number(req.query.status) : undefined,
        startDate: req.query.startDate
          ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
            String(req.query.startDate)
          : undefined,
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      };

      const result = await salesService.findAll(filter);
      res.setHeader('X-Cache', result.cacheStatus);
      res
        .status(200)
        .json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id); // Conversión manual
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }

      const order = await salesService.findById(id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: 'Orden no encontrada' });
      }

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body; // Lectura directa del body
      const newOrder = await salesService.create(data);

      res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        data: {
          SalesOrderID: newOrder.SalesOrderID,
          SalesOrderNumber: newOrder.SalesOrderNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
