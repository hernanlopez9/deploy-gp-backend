import { prisma } from '../../../db/prisma.service.js';

export class OrdersService {
  // Obtener todas las órdenes
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

    // Filtros
    if (customerId) where.CustomerID = customerId;
    if (territoryId) where.TerritoryID = territoryId;
    if (status) where.Status = status;

    if (startDate || endDate) {
      where.OrderDate = {};

      if (startDate) {
        where.OrderDate.gte = new Date(startDate);
      }

      if (endDate) {
        where.OrderDate.lte = new Date(endDate);
      }
    }

    // Buscar órdenes y contar el total
    const [orders, total] = await Promise.all([
      prisma.salesOrderHeader.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: {
          OrderDate: 'desc',
        },
      }),

      prisma.salesOrderHeader.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Obtener una orden por ID
  async findById(id: number) {
    const order = await prisma.salesOrderHeader.findUnique({
      where: {
        SalesOrderID: id,
      },
      include: {
        SalesOrderDetail: true,
      },
    });

    return order;
  }

  // Crear una orden
  async create(data: {
    customerID: number;
    billToAddressID: number;
    shipToAddressID: number;
    shipMethodID: number;
    salesPersonID?: number;
    territoryID?: number;
    creditCardID?: number;
    items: Array<{
      productID: number;
      orderQty: number;
      specialOfferID?: number;
      unitPriceDiscount?: number;
    }>;
  }) {
    // Obtener los productos
    const productIds = data.items.map((item) => item.productID);

    const products = await prisma.product.findMany({
      where: {
        ProductID: {
          in: productIds,
        },
      },
      select: {
        ProductID: true,
        ListPrice: true,
      },
    });

    // Crear un mapa de precios
    const priceMap = new Map(
      products.map((product) => [product.ProductID, product.ListPrice]),
    );

    let subTotal = 0;

    // Crear los detalles de la orden
    const detailsPayload = data.items.map((item) => {
      const price = Number(priceMap.get(item.productID) ?? 0);

      const discount = item.unitPriceDiscount ?? 0;

      const specialOfferID = item.specialOfferID ?? 1;

      const lineTotal = item.orderQty * price * (1 - discount);

      subTotal += lineTotal;

      return {
        ProductID: item.productID,
        OrderQty: item.orderQty,
        SpecialOfferID: specialOfferID,
        UnitPrice: price,
        UnitPriceDiscount: discount,
        LineTotal: lineTotal,
      };
    });

    // Crear la orden y sus detalles
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

          SalesOrderDetail: {
            create: detailsPayload,
          },
        },

        include: {
          SalesOrderDetail: true,
        },
      });
    });

    return newOrder;
  }

  // Actualizar una orden
  async update(
    id: number,
    data: {
      status?: number;
      customerID?: number;
      billToAddressID?: number;
      shipToAddressID?: number;
      shipMethodID?: number;
      salesPersonID?: number;
      territoryID?: number;
      creditCardID?: number;
    },
  ) {
    // Verificar que exista la orden
    const existing = await prisma.salesOrderHeader.findUnique({
      where: {
        SalesOrderID: id,
      },
      select: {
        SalesOrderID: true,
      },
    });

    if (!existing) {
      return null;
    }

    // Actualizar la orden
    const updated = await prisma.salesOrderHeader.update({
      where: {
        SalesOrderID: id,
      },
      data: {
        Status: data.status,
        CustomerID: data.customerID,
        BillToAddressID: data.billToAddressID,
        ShipToAddressID: data.shipToAddressID,
        ShipMethodID: data.shipMethodID,
        SalesPersonID: data.salesPersonID,
        TerritoryID: data.territoryID,
        CreditCardID: data.creditCardID,
      },
    });

    return updated;
  }

  // Eliminar una orden
  async delete(id: number) {
    // Verificar que exista
    const existing = await prisma.salesOrderHeader.findUnique({
      where: {
        SalesOrderID: id,
      },
      select: {
        SalesOrderID: true,
      },
    });

    if (!existing) {
      return null;
    }

    // Eliminar primero los detalles y después la orden
    await prisma.$transaction(async (tx) => {
      await tx.salesOrderDetail.deleteMany({
        where: {
          SalesOrderID: id,
        },
      });

      await tx.salesOrderHeader.delete({
        where: {
          SalesOrderID: id,
        },
      });
    });

    return true;
  }
}

export const ordersService = new OrdersService();
