import { createHmac, randomBytes } from 'crypto';
import { createCache, type Cache } from 'cache-manager';
//import { Prisma } from '../../../../generated/prisma/index.js';

import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type {
  CreateClientBody,
  CreateAddressBody,
  SearchClientQuery,
  ClientOrdersFilterQuery,
  ClientOptionsQuery,
  ClientOptionsResponse,
} from '../../../shared/types/clients.types.js';
import { Prisma } from '../../../../generated/prisma/client.js';

export class ClientsService {
  private cache: Cache;
  private static readonly CLIENT_OPTIONS_TTL_MS = 600_000;
  private clientOptionsCacheVersion = 1;

  private readonly orderStatusMap: Record<number, string> = {
    1: 'Pending',
    2: 'Approved',
    3: 'Backordered',
    4: 'Rejected',
    5: 'Shipped',
    6: 'Cancelled',
  };

  private readonly statusAliasToCode: Record<string, number> = {
    pending: 1,
    inprocess: 1,
    approved: 2,
    backordered: 3,
    rejected: 4,
    shipped: 5,
    cancelled: 6,
    canceled: 6,
  };

  constructor(private readonly prisma: PrismaClient) {
    this.cache = createCache({
      ttl: ClientsService.CLIENT_OPTIONS_TTL_MS,
    });
  }

  private hashPassword(password: string) {
    const salt = randomBytes(5).toString('hex');
    const hash = createHmac('sha512', salt).update(password).digest('hex');
    return { salt, hash };
  }

  async createClient(data: CreateClientBody) {
    if (data.Type === 'Tienda' && !data.CompanyName) {
      throw new AppError('CompanyName is required when Type is Tienda', 400);
    }

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        Person: { EmailAddress: { some: { EmailAddress: data.EmailAddress } } },
      },
      select: { CustomerID: true },
    });

    if (existingCustomer)
      throw new AppError('Email address is already registered', 400);

    const { hash, salt } = this.hashPassword(data.Password);
    const phoneNumberType = await this.prisma.phoneNumberType.findFirst({
      orderBy: { PhoneNumberTypeID: 'asc' },
      select: { PhoneNumberTypeID: true },
    });

    if (!phoneNumberType)
      throw new AppError('Phone number type catalog is empty', 400);

    const createdCustomer = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const person = await tx.person.create({
          data: {
            PersonType: data.Type === 'Tienda' ? 'SC' : 'IN',
            FirstName: data.FirstName,
            LastName: data.LastName,
            EmailPromotion: 0,
            BusinessEntity: { create: {} },
          },
          select: { BusinessEntityID: true },
        });

        await tx.emailAddress.create({
          data: {
            BusinessEntityID: person.BusinessEntityID,
            EmailAddress: data.EmailAddress,
          },
        });

        await tx.personPhone.create({
          data: {
            BusinessEntityID: person.BusinessEntityID,
            PhoneNumber: data.PhoneNumber,
            PhoneNumberTypeID: phoneNumberType.PhoneNumberTypeID,
          },
        });

        await tx.password.create({
          data: {
            BusinessEntityID: person.BusinessEntityID,
            PasswordHash: hash,
            PasswordSalt: salt,
          },
        });

        let storeBusinessEntityID: number | null = null;
        if (data.Type === 'Tienda' && data.CompanyName) {
          const store = await tx.store.create({
            data: { Name: data.CompanyName, BusinessEntity: { create: {} } },
            select: { BusinessEntityID: true },
          });
          storeBusinessEntityID = store.BusinessEntityID;
        }

        const accountNumber = `CUST-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)
          .toUpperCase()}`;

        return tx.customer.create({
          data: {
            AccountNumber: accountNumber,
            Person: { connect: { BusinessEntityID: person.BusinessEntityID } },
            ...(storeBusinessEntityID
              ? {
                  Store: {
                    connect: { BusinessEntityID: storeBusinessEntityID },
                  },
                }
              : {}),
          },
          select: { CustomerID: true, ModifiedDate: true },
        });
      },
    );

    this.bumpClientOptionsCacheVersion();

    return {
      CustomerID: createdCustomer.CustomerID,
      FirstName: data.FirstName,
      LastName: data.LastName,
      EmailAddress: data.EmailAddress,
      PhoneNumber: data.PhoneNumber,
      Type: data.Type,
      CompanyName: data.Type === 'Tienda' ? data.CompanyName : undefined,
      ModifiedDate: createdCustomer.ModifiedDate,
    };
  }

  async addAddressToClient(customerId: number, data: CreateAddressBody) {
    const customer = await this.prisma.customer.findUnique({
      where: { CustomerID: customerId },
      select: {
        CustomerID: true,
        Person: { select: { BusinessEntityID: true } },
        Store: { select: { BusinessEntityID: true } },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);

    const businessEntityId =
      customer.Person?.BusinessEntityID ?? customer.Store?.BusinessEntityID;
    if (!businessEntityId)
      throw new AppError('Customer does not have a business entity', 400);

    const stateProvince = await this.prisma.stateProvince.findFirst({
      where: {
        Name: data.StateProvince,
        CountryRegion: { Name: data.CountryRegion },
      },
      select: { StateProvinceID: true },
    });

    if (!stateProvince)
      throw new AppError(
        'Invalid StateProvince/CountryRegion combination',
        400,
      );

    const address = await this.prisma.address.create({
      data: {
        AddressLine1: data.AddressLine1,
        AddressLine2: data.AddressLine2,
        City: data.City,
        StateProvince: {
          connect: { StateProvinceID: stateProvince.StateProvinceID },
        },
        PostalCode: data.PostalCode,
      },
      select: {
        AddressID: true,
        AddressLine1: true,
        AddressLine2: true,
        City: true,
        PostalCode: true,
        ModifiedDate: true,
        StateProvince: {
          select: { Name: true, CountryRegion: { select: { Name: true } } },
        },
      },
    });

    const addressType = await this.prisma.addressType.findFirst({
      where: { Name: data.AddressType },
      select: { AddressTypeID: true },
    });

    if (!addressType) throw new AppError('Invalid address type', 400);

    await this.prisma.businessEntityAddress.create({
      data: {
        BusinessEntityID: businessEntityId,
        AddressID: address.AddressID,
        AddressTypeID: addressType.AddressTypeID,
      },
    });

    this.bumpClientOptionsCacheVersion();

    return {
      CustomerID: customerId,
      AddressID: address.AddressID,
      AddressType: data.AddressType,
      AddressLine1: address.AddressLine1,
      AddressLine2: address.AddressLine2 ?? undefined,
      City: address.City,
      StateProvince: address.StateProvince.Name,
      PostalCode: address.PostalCode,
      CountryRegion: address.StateProvince.CountryRegion.Name,
      ModifiedDate: address.ModifiedDate,
    };
  }

  async getClientAddresses(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { CustomerID: customerId },
      select: {
        Person: { select: { BusinessEntityID: true } },
        Store: { select: { BusinessEntityID: true } },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);

    const businessEntityIds = Array.from(
      new Set(
        [
          customer.Person?.BusinessEntityID,
          customer.Store?.BusinessEntityID,
        ].filter((id): id is number => typeof id === 'number'),
      ),
    );

    if (businessEntityIds.length === 0)
      throw new AppError('Customer does not have a business entity', 400);

    const addresses = await this.prisma.businessEntityAddress.findMany({
      where: { BusinessEntityID: { in: businessEntityIds } },
      orderBy: [{ AddressID: 'asc' }],
      select: {
        AddressID: true,
        AddressType: { select: { Name: true } },
        Address: {
          select: {
            AddressLine1: true,
            City: true,
            PostalCode: true,
            StateProvince: {
              select: {
                StateProvinceCode: true,
                CountryRegion: { select: { CountryRegionCode: true } },
              },
            },
          },
        },
      },
    });

    return addresses.map(
      (addr: {
        AddressID: number;
        AddressType: { Name: string };
        Address: {
          AddressLine1: string;
          City: string;
          PostalCode: string;
          StateProvince: {
            StateProvinceCode: string;
            CountryRegion: { CountryRegionCode: string };
          };
        };
      }) => ({
        addressId: addr.AddressID,
        addressType: addr.AddressType.Name,
        addressLine1: addr.Address.AddressLine1,
        city: addr.Address.City,
        stateProvince: addr.Address.StateProvince.StateProvinceCode,
        postalCode: addr.Address.PostalCode,
        countryRegion:
          addr.Address.StateProvince.CountryRegion.CountryRegionCode,
      }),
    );
  }

  async getClientOptions(
    query: ClientOptionsQuery,
  ): Promise<ClientOptionsResponse> {
    const normalizedQuery = query.q?.trim() ?? '';
    const queryKey = normalizedQuery === '' ? '_' : normalizedQuery;
    const cacheKey = this.buildClientOptionsCacheKey(queryKey, query.limit);

    const cached = await this.cache.get<ClientOptionsResponse>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return { ...cached, cacheStatus: 'HIT' };
    }

    const customerId = Number(normalizedQuery);
    const searchById = Number.isInteger(customerId) && customerId > 0;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    const where: Prisma.CustomerWhereInput | undefined =
      normalizedQuery === ''
        ? undefined
        : searchById
          ? { CustomerID: customerId }
          : normalizedQuery.includes('@')
            ? {
                Person: {
                  EmailAddress: {
                    some: { EmailAddress: { startsWith: normalizedQuery } },
                  },
                },
              }
            : {
                OR: [
                  {
                    Person: {
                      FirstName: { startsWith: terms[0] ?? normalizedQuery },
                    },
                  },
                  {
                    Person: {
                      LastName: {
                        startsWith: terms.length > 1 ? terms[1] : terms[0],
                      },
                    },
                  },
                  { Store: { Name: { startsWith: normalizedQuery } } },
                ],
              };

    let customers: any[];
    try {
      customers = await this.prisma.customer.findMany({
        where,
        take: query.limit,
        orderBy: [{ CustomerID: 'asc' }],
        select: {
          CustomerID: true,
          Person: { select: { FirstName: true, LastName: true } },
          Store: { select: { Name: true } },
        },
      });
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'ETIMEOUT'
      ) {
        customers = await this.prisma.customer.findMany({
          take: query.limit,
          orderBy: [{ CustomerID: 'asc' }],
          select: {
            CustomerID: true,
            Person: { select: { FirstName: true, LastName: true } },
            Store: { select: { Name: true } },
          },
        });
      } else {
        throw error;
      }
    }

    const data = customers.map((c: any) => {
      const fullName = c.Person
        ? [c.Person.FirstName, c.Person.LastName].filter(Boolean).join(' ')
        : (c.Store?.Name ?? `Customer ${c.CustomerID}`);
      return { id: c.CustomerID, label: `${fullName} (ID ${c.CustomerID})` };
    });

    const payload: Omit<ClientOptionsResponse, 'cacheStatus'> = {
      data,
      meta: { limit: query.limit, query: normalizedQuery },
    };

    await this.cache.set(cacheKey, payload);
    return { ...payload, cacheStatus: 'MISS' };
  }

  async getClientOrdersHistory(
    customerId: number,
    filters: ClientOrdersFilterQuery,
  ) {
    await this.ensureCustomerExists(customerId);
    const where = this.buildOrdersWhere(customerId, filters);

    const [orders, total] = await Promise.all([
      this.prisma.salesOrderHeader.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: [{ OrderDate: 'desc' }, { SalesOrderID: 'desc' }],
        select: {
          SalesOrderID: true,
          OrderDate: true,
          TotalDue: true,
          Status: true,
        },
      }),
      this.prisma.salesOrderHeader.count({ where }),
    ]);

    return {
      CustomerID: customerId,
      data: orders.map(
        (order: {
          SalesOrderID: number;
          OrderDate: Date;
          TotalDue: Prisma.Decimal | number | null;
          Status: number;
        }) => ({
          SalesOrderID: order.SalesOrderID,
          OrderDate: order.OrderDate,
          TotalAmount: Number(Number(order.TotalDue).toFixed(2)),
          StatusCode: order.Status,
          Status:
            this.orderStatusMap[order.Status] ?? `Unknown (${order.Status})`,
        }),
      ),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getClientTotalPurchases(customerId: number) {
    await this.ensureCustomerExists(customerId);
    const where: Prisma.SalesOrderHeaderWhereInput = { CustomerID: customerId };

    const [totalOrders, aggregate] = await Promise.all([
      this.prisma.salesOrderHeader.count({ where }),
      this.prisma.salesOrderHeader.aggregate({
        where,
        _sum: { TotalDue: true },
      }),
    ]);

    return {
      CustomerID: customerId,
      TotalOrders: totalOrders,
      TotalAmount: Number(Number(aggregate._sum.TotalDue ?? 0).toFixed(2)),
    };
  }

  async searchClients(query: SearchClientQuery) {
    const where: Prisma.CustomerWhereInput = {};
    if (query.id) where.CustomerID = query.id;

    if (query.email) {
      where.Person = {
        EmailAddress: { some: { EmailAddress: { contains: query.email } } },
      };
    }

    if (query.name) {
      const nameParts = query.name.split(' ').filter(Boolean);
      const firstName = nameParts[0] ?? query.name;
      const lastName = nameParts.slice(1).join(' ');
      where.OR = [
        {
          Person: {
            OR: [
              { FirstName: { contains: firstName } },
              { LastName: { contains: lastName || firstName } },
            ],
          },
        },
        { Store: { Name: { contains: query.name } } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ ModifiedDate: 'desc' }, { CustomerID: 'asc' }],
        include: {
          Person: {
            include: {
              EmailAddress: true,
              PersonPhone: true,
              BusinessEntity: {
                include: {
                  BusinessEntityAddress: {
                    include: {
                      AddressType: true,
                      Address: {
                        include: {
                          StateProvince: { include: { CountryRegion: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          Store: {
            include: {
              BusinessEntity: {
                include: {
                  BusinessEntityAddress: {
                    include: {
                      AddressType: true,
                      Address: {
                        include: {
                          StateProvince: { include: { CountryRegion: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const data = customers.map((c: any) => ({
      CustomerID: c.CustomerID,
      FirstName: c.Person?.FirstName ?? c.Store?.Name ?? '',
      MiddleName: c.Person?.MiddleName ?? undefined,
      LastName: c.Person?.LastName ?? c.Store?.Name ?? '',
      EmailAddress: c.Person?.EmailAddress?.[0]?.EmailAddress ?? undefined,
      Phone: c.Person?.PersonPhone?.[0]?.PhoneNumber ?? undefined,
      Type: c.Store ? 'Tienda' : 'Persona',
      CompanyName: c.Store?.Name ?? undefined,
      Addresses: [
        ...(c.Person?.BusinessEntity?.BusinessEntityAddress ?? []),
        ...(c.Store?.BusinessEntity?.BusinessEntityAddress ?? []),
      ].map((bea: any) => ({
        AddressLine1: bea.Address.AddressLine1,
        AddressLine2: bea.Address.AddressLine2 ?? undefined,
        City: bea.Address.City,
        StateProvince: bea.Address.StateProvince.Name,
        PostalCode: bea.Address.PostalCode,
        CountryRegion: bea.Address.StateProvince.CountryRegion.Name,
        AddressType: bea.AddressType.Name,
      })),
      ModifiedDate: c.ModifiedDate,
    }));

    return { data, total, page: query.page, limit: query.limit };
  }

  // --- Métodos Privados ---

  private async ensureCustomerExists(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { CustomerID: customerId },
      select: { CustomerID: true },
    });
    if (!customer) throw new AppError('Customer not found', 404);
  }

  private buildOrdersWhere(
    customerId: number,
    filters: ClientOrdersFilterQuery,
  ): Prisma.SalesOrderHeaderWhereInput {
    const where: Prisma.SalesOrderHeaderWhereInput = { CustomerID: customerId };
    const from = filters.from ? this.parseDate(filters.from) : undefined;
    const to = filters.to ? this.parseDate(filters.to) : undefined;

    if (from && to && from > to)
      throw new AppError('from must be earlier than or equal to to', 400);
    if (from || to) {
      where.OrderDate = { gte: from, lt: to ? this.addDays(to, 1) : undefined };
    }

    if (filters.status) {
      const statusCode = this.statusAliasToCode[filters.status];
      if (!statusCode)
        throw new AppError(
          'Invalid status. Allowed: pending, approved, backordered, rejected, shipped, cancelled',
          400,
        );
      where.Status = statusCode;
    }
    return where;
  }

  private parseDate(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
      throw new AppError(`Invalid date: ${value}`, 400);
    return date;
  }

  private addDays(date: Date, amount: number): Date {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + amount);
    return copy;
  }

  private buildClientOptionsCacheKey(query: string, limit: number): string {
    return `clients:options:v=${this.clientOptionsCacheVersion}:q=${query}:limit=${limit}`;
  }

  private bumpClientOptionsCacheVersion() {
    this.clientOptionsCacheVersion += 1;
  }
}
