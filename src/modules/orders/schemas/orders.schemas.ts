import { z } from 'zod';

export const ordersFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  customerId: z.coerce.number().int().min(1).optional(),

  status: z.coerce.number().int().min(1).max(5).optional(),
});

export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const createOrderSchema = z.object({
  customerID: z.number().int().min(1),

  billToAddressID: z.number().int().min(1),

  shipToAddressID: z.number().int().min(1),

  shipMethodID: z.number().int().min(1),

  salesPersonID: z.number().int().min(1).optional(),

  territoryID: z.number().int().min(1).optional(),

  creditCardID: z.number().int().min(1).optional(),

  items: z
    .array(
      z.object({
        productID: z.number().int().min(1),

        orderQty: z.number().int().min(1),

        specialOfferID: z.number().int().min(1).default(1),

        unitPriceDiscount: z.number().min(0).max(1).default(0),
      }),
    )
    .min(1, 'La orden debe tener al menos un producto'),
});

export const updateOrderSchema = z.object({
  status: z.number().int().min(1).max(5).optional(),

  customerID: z.number().int().min(1).optional(),

  billToAddressID: z.number().int().min(1).optional(),

  shipToAddressID: z.number().int().min(1).optional(),

  shipMethodID: z.number().int().min(1).optional(),

  salesPersonID: z.number().int().min(1).optional(),

  territoryID: z.number().int().min(1).optional(),

  creditCardID: z.number().int().min(1).optional(),
});