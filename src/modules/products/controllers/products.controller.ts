import type { Request, Response, NextFunction } from 'express';
import { productsService } from '../services/products.service.js';

export class ProductsController {
  async getOptions(req: Request, res: Response, next: NextFunction) {
    try {
      // req.validatedQuery es inyectado por el middleware de validación (ver paso 5)
      const query = (req as any).validatedQuery as {
        q?: string;
        limit: number;
      };

      const result = await productsService.getProductOptions(query);

      res.setHeader('X-Cache', result.cacheStatus);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = (req as any).validatedQuery as {
        page: number;
        limit: number;
        name?: string;
        category?: number;
        subcategory?: number;
      };

      const result = await productsService.findAll(filter);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
