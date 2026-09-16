import { prisma } from '../../../db/prisma.service.js';
import { createCache } from 'cache-manager';
import type {
  SalesOrderListItem,
  SalesOrderDetailResponse,
  CreateSalesOrderDto,
  PaginationMeta,
} from '../../../shared/types/sales.types.js';

const cache = createCache({ ttl: 60_000 }); // 1 minuto
let salesCacheVersion = 1;

export class SalesService {
  async findAll(filter: {
    page: number;
    limit: number;
    customerId?: number;
    territoryId?: number;
    status?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, customerId, territoryId, status, startDate, endDate } =
      filter;
    const where: any = {};

    if (customerId) where.CustomerID = customerId;
    if (territoryId) where.TerritoryID = territoryId;
    if (status) where.Status = status;
    if (startDate || endDate) {
      where.OrderDate = {};
      if (startDate) where.OrderDate.gte = new Date(startDate);
      if (endDate) where.OrderDate.lte = new Date(endDate);
    }

    const cacheKey = `sales:orders:v=${salesCacheVersion}:page=${page}:limit=${limit}:c=${customerId}:t=${territoryId}:s=${status}`;
    const cached = await cache.get<{
      data: SalesOrderListItem[];
      meta: PaginationMeta;
    }>(cacheKey);

    if (cached) return { ...cached, cacheStatus: 'HIT' as const };

    const [orders, total] = await Promise.all([
      prisma.salesOrderHeader.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { OrderDate: 'desc' },
        select: {
          SalesOrderID: true,
          SalesOrderNumber: true,
          OrderDate: true,
          DueDate: true,
          TotalDue: true,
          Status: true,
          Customer: {
            select: { Person: { select: { FirstName: true, LastName: true } } },
          },
          SalesPerson: {
            select: {
              Employee: {
                select: {
                  Person: { select: { FirstName: true, LastName: true } },
                },
              },
            },
          },
          SalesTerritory: { select: { Name: true } },
        },
      }),
      prisma.salesOrderHeader.count({ where }),
    ]);

    const data: SalesOrderListItem[] = orders.map((order: any) => ({
      SalesOrderID: order.SalesOrderID,
      SalesOrderNumber: order.SalesOrderNumber,
      OrderDate: order.OrderDate,
      DueDate: order.DueDate,
      TotalDue: Number(order.TotalDue),
      Status: order.Status,
      CustomerName: order.Customer?.Person
        ? `${order.Customer.Person.FirstName} ${order.Customer.Person.LastName}`.trim()
        : 'Walk-in Customer',
      SalesPersonName: order.SalesPerson?.Employee?.Person
        ? `${order.SalesPerson.Employee.Person.FirstName} ${order.SalesPerson.Employee.Person.LastName}`.trim()
        : null,
      TerritoryName: order.SalesTerritory?.Name || null,
    }));

    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      appliedFilters: { customerId, territoryId, status, startDate, endDate },
    };

    const payload = { data, meta };
    await cache.set(cacheKey, payload);
    return { ...payload, cacheStatus: 'MISS' as const };
  }

  async findById(id: number): Promise<SalesOrderDetailResponse | null> {
    const order = await prisma.salesOrderHeader.findUnique({
      where: { SalesOrderID: id },
      select: {
        SalesOrderID: true,
        SalesOrderNumber: true,
        OrderDate: true,
        DueDate: true,
        TotalDue: true,
        SubTotal: true,
        TaxAmt: true,
        Freight: true,
        Status: true,
        Customer: {
          select: { Person: { select: { FirstName: true, LastName: true } } },
        },
        SalesPerson: {
          select: {
            Employee: {
              select: {
                Person: { select: { FirstName: true, LastName: true } },
              },
            },
          },
        },
        SalesTerritory: { select: { Name: true } },
        SalesOrderDetail: {
          select: {
            SalesOrderDetailID: true,
            ProductID: true,
            OrderQty: true,
            UnitPrice: true,
            UnitPriceDiscount: true,
            LineTotal: true,
            Product: { select: { Name: true } },
          },
        },
      },
    });

    if (!order) return null;

    const typedOrder = order as any;

    return {
      SalesOrderID: typedOrder.SalesOrderID,
      SalesOrderNumber: typedOrder.SalesOrderNumber,
      OrderDate: typedOrder.OrderDate,
      DueDate: typedOrder.DueDate,
      TotalDue: Number(typedOrder.TotalDue),
      Status: typedOrder.Status,
      SubTotal: Number(typedOrder.SubTotal),
      TaxAmt: Number(typedOrder.TaxAmt),
      Freight: Number(typedOrder.Freight),
      CustomerName: typedOrder.Customer?.Person
        ? `${typedOrder.Customer.Person.FirstName} ${typedOrder.Customer.Person.LastName}`.trim()
        : 'Walk-in Customer',
      SalesPersonName: typedOrder.SalesPerson?.Employee?.Person
        ? `${typedOrder.SalesPerson.Employee.Person.FirstName} ${typedOrder.SalesPerson.Employee.Person.LastName}`.trim()
        : null,
      TerritoryName: typedOrder.SalesTerritory?.Name || null,
      details: (typedOrder.SalesOrderDetail || []).map((d: any) => ({
        SalesOrderDetailID: d.SalesOrderDetailID,
        ProductID: d.ProductID,
        ProductName: d.Product?.Name ?? '',
        OrderQty: d.OrderQty,
        UnitPrice: Number(d.UnitPrice),
        UnitPriceDiscount: Number(d.UnitPriceDiscount),
        LineTotal: Number(d.LineTotal),
      })),
    };
  }

  async create(data: CreateSalesOrderDto) {
    const productIds = data.items.map((i) => i.productID);
    const products = await prisma.product.findMany({
      where: { ProductID: { in: productIds } },
      select: { ProductID: true, ListPrice: true },
    });
    const priceMap = new Map(products.map((p) => [p.ProductID, p.ListPrice]));

    let subTotal = 0;
    const detailsPayload = data.items.map((item) => {
      const price = Number(priceMap.get(item.productID) || 0);
      const discount = item.unitPriceDiscount || 0;
      const lineTotal = item.orderQty * price * (1 - discount);
      subTotal += lineTotal;

      return {
        ProductID: item.productID,
        OrderQty: item.orderQty,
        SpecialOfferID: item.specialOfferID || 1,
        UnitPrice: price,
        UnitPriceDiscount: discount,
        LineTotal: lineTotal,
      };
    });

    const newOrder = await prisma.$transaction(async (tx) => {
      return tx.salesOrderHeader.create({
        data: {
          SalesOrderNumber: `SO-${Date.now()}`,
          CustomerID: data.customerID,
          BillToAddressID: data.billToAddressID,
          ShipToAddressID: data.shipToAddressID,
          ShipMethodID: data.shipMethodID,
          SalesPersonID: data.salesPersonID,
          TerritoryID: data.territoryID,
          CreditCardID: data.creditCardID,
          OrderDate: new Date(),
          DueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          Status: 1,
          SubTotal: subTotal,
          TaxAmt: 0,
          Freight: 0,
          TotalDue: subTotal,
          SalesOrderDetail: { create: detailsPayload },
        },
        include: { SalesOrderDetail: true },
      });
    });

    this.bumpSalesCacheVersion();

    return newOrder;
  }

  bumpSalesCacheVersion() {
    salesCacheVersion += 1;
  }
}

export const salesService = new SalesService();