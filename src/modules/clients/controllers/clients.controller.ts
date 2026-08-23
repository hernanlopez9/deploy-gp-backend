import type { Request, Response, NextFunction } from 'express';
import { ClientsService } from '../services/clients.service.js';
import {
  createClientSchema,
  createAddressSchema,
  searchClientQuerySchema,
  clientOrdersFilterSchema,
  clientOptionsQuerySchema,
} from '../schemas/clients.schemas.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createClientSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        throw new AppError(error.details.map((d) => d.message).join(', '), 400);

      const result = await this.clientsService.createClient(value);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getOptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = clientOptionsQuerySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        throw new AppError(error.details.map((d) => d.message).join(', '), 400);

      const result = await this.clientsService.getClientOptions(value);
      res.setHeader('X-Cache', result.cacheStatus);
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = parseInt(req.params.id as string, 10);
      if (isNaN(customerId)) throw new AppError('Invalid customer id', 400);

      const result = await this.clientsService.getClientAddresses(customerId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = parseInt(req.params.id as string, 10);
      if (isNaN(customerId)) throw new AppError('Invalid customer id', 400);

      const { error, value } = createAddressSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        throw new AppError(error.details.map((d) => d.message).join(', '), 400);

      const result = await this.clientsService.addAddressToClient(
        customerId,
        value,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getOrdersHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = parseInt(req.params.id as string, 10);
      if (isNaN(customerId)) throw new AppError('Invalid customer id', 400);

      const { error, value } = clientOrdersFilterSchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        throw new AppError(error.details.map((d) => d.message).join(', '), 400);

      const result = await this.clientsService.getClientOrdersHistory(
        customerId,
        value,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getTotalPurchases = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = parseInt(req.params.id as string, 10);
      if (isNaN(customerId)) throw new AppError('Invalid customer id', 400);

      const result =
        await this.clientsService.getClientTotalPurchases(customerId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = searchClientQuerySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        throw new AppError(error.details.map((d) => d.message).join(', '), 400);

      const result = await this.clientsService.searchClients(value);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
