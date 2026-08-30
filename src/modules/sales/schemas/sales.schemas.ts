import { z } from 'zod';

export const salesOrderFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  customerId: z.coerce.number().int().min(1).optional(),
  territoryId: z.coerce.number().int().min(1).optional(),
  status: z.coerce.number().int().min(1).max(5).optional(),
  startDate: z.string().datetime().optional().or(z.literal('')),
  endDate: z.string().datetime().optional().or(z.literal('')),
});

export const createSalesOrderSchema = z.object({
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
        specialOfferID: z.number().int().min(1).optional(),
        unitPriceDiscount: z.number().min(0).max(1).optional().default(0),
      }),
    )
    .min(1, 'La orden debe tener al menos un producto'),
});

export const salesOrderIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});
