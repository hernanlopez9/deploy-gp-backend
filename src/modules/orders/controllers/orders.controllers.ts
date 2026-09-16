import type { Request, Response, NextFunction } from 'express';
import { ordersService } from '../models/orders.service.js';

export class OrdersController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,

        customerId: req.query.customerId
          ? Number(req.query.customerId)
          : undefined,

        status: req.query.status ? Number(req.query.status) : undefined,
      };

      const result = await ordersService.findAll(filter);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const order = await ordersService.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada',
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;

      const newOrder = await ordersService.create(data);

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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const updated = await ordersService.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Orden actualizada exitosamente',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const deleted = await ordersService.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada',
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();
