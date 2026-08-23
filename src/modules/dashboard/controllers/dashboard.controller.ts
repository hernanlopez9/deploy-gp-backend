import type { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { DashboardFilter } from '../../../shared/types/dashboard.types.js';
import { dashboardFilterSchema } from '../shemas/dashboard.schemas.js';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getSalesSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = this.validateQuery(req.query);
      const result = await this.dashboardService.getSalesSummary(filter);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getOrdersCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = this.validateQuery(req.query);
      const result = await this.dashboardService.getOrdersCount(filter);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getActiveCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const filter = this.validateQuery(req.query);
      const result = await this.dashboardService.getActiveCustomers(filter);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getTopSeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = this.validateQuery(req.query);
      const result = await this.dashboardService.getTopSeller(filter);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  private validateQuery(query: any): DashboardFilter {
    const { error, value } = dashboardFilterSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      throw new AppError(error.details.map((d) => d.message).join(', '), 400);
    }
    return value as DashboardFilter;
  }
}
