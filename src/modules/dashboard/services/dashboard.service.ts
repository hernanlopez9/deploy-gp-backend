import type {
  DashboardFilter,
  DateRange,
  KPIResponse,
  TopSellerData,
  TrendPoint,
} from '../../../shared/types/dashboard.types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { createCache, type Cache } from 'cache-manager';
import type {
  Prisma,
  PrismaClient,
} from '../../../../generated/prisma/client.js';

export class DashboardService {
  private cache: Cache;
  private static readonly DASHBOARD_TTL_MS = 120_000;

  constructor(private readonly prisma: PrismaClient) {
    // Inicializamos el cache en memoria. En producción podrías usar redis aquí.
    this.cache = createCache({
      ttl: DashboardService.DASHBOARD_TTL_MS,
    });
  }

  async getSalesSummary(filter: DashboardFilter): Promise<KPIResponse> {
    const ranges = this.resolveRanges(filter);
    const key = this.buildCacheKey('sales-summary', ranges, filter);

    return this.withCache(key, async () => {
      const [currentOrders, previousOrders] = await this.loadMetricOrders(
        ranges,
        this.salesOrderSelect,
      );

      const currentValue = this.sumSales(currentOrders);
      const previousValue = this.sumSales(previousOrders);

      const response: KPIResponse = {
        filters: this.buildFilterResponse(ranges, filter.territory),
        kpi: {
          name: 'total_sales',
          value: Number(currentValue.toFixed(2)),
        },
        comparison: this.buildComparison(currentValue, previousValue),
      };

      if (!filter.includeTrend) return response;

      return {
        ...response,
        trend: {
          current: this.buildTrendSeries(
            currentOrders,
            ranges.current,
            (order) => Number(order.TotalDue),
          ),
          previous: this.buildTrendSeries(
            previousOrders,
            ranges.previous,
            (order) => Number(order.TotalDue),
          ),
        },
      };
    });
  }

  async getOrdersCount(filter: DashboardFilter): Promise<KPIResponse> {
    const ranges = this.resolveRanges(filter);
    const key = this.buildCacheKey('orders-count', ranges, filter);

    return this.withCache(key, async () => {
      const [currentOrders, previousOrders] = await this.loadMetricOrders(
        ranges,
        this.orderCountSelect,
      );

      const currentValue = currentOrders.length;
      const previousValue = previousOrders.length;

      const response: KPIResponse = {
        filters: this.buildFilterResponse(ranges, filter.territory),
        kpi: { name: 'orders_count', value: currentValue },
        comparison: this.buildComparison(currentValue, previousValue),
      };

      if (!filter.includeTrend) return response;

      return {
        ...response,
        trend: {
          current: this.buildTrendSeries(
            currentOrders,
            ranges.current,
            () => 1,
          ),
          previous: this.buildTrendSeries(
            previousOrders,
            ranges.previous,
            () => 1,
          ),
        },
      };
    });
  }

  async getActiveCustomers(filter: DashboardFilter): Promise<KPIResponse> {
    const ranges = this.resolveRanges(filter);
    const key = this.buildCacheKey('active-customers', ranges, filter);

    return this.withCache(key, async () => {
      const [currentOrders, previousOrders] = await this.loadMetricOrders(
        ranges,
        this.activeCustomersSelect,
      );

      const currentValue = this.uniqueCustomerCount(currentOrders);
      const previousValue = this.uniqueCustomerCount(previousOrders);

      const response: KPIResponse = {
        filters: this.buildFilterResponse(ranges, filter.territory),
        kpi: { name: 'active_customers', value: currentValue },
        comparison: this.buildComparison(currentValue, previousValue),
      };

      if (!filter.includeTrend) return response;

      return {
        ...response,
        trend: {
          current: this.buildUniqueCustomerTrendSeries(
            currentOrders,
            ranges.current,
          ),
          previous: this.buildUniqueCustomerTrendSeries(
            previousOrders,
            ranges.previous,
          ),
        },
      };
    });
  }

  async getTopSeller(filter: DashboardFilter): Promise<KPIResponse> {
    const ranges = this.resolveRanges(filter);
    const key = this.buildCacheKey('top-seller', ranges, filter);

    return this.withCache(key, async () => {
      const [currentOrders, previousOrders] = await this.loadMetricOrders(
        ranges,
        this.topSellerSelect,
      );

      const currentTopSeller = this.computeTopSeller(currentOrders);
      const previousTopSeller = this.computeTopSeller(previousOrders);

      const sellerForTrend =
        currentTopSeller?.name ?? previousTopSeller?.name ?? null;

      const response: KPIResponse = {
        filters: this.buildFilterResponse(ranges, filter.territory),
        kpi: { name: 'top_seller', value: currentTopSeller },
        comparison: this.buildComparison(
          currentTopSeller?.totalSales ?? 0,
          previousTopSeller?.totalSales ?? 0,
        ),
        previousPeriodTopSeller: previousTopSeller,
      };

      if (!filter.includeTrend) return response;

      return {
        ...response,
        trend: {
          current: this.buildTrendSeries(
            currentOrders,
            ranges.current,
            (order) =>
              sellerForTrend !== null &&
              this.getSellerName(order) === sellerForTrend
                ? Number((order as { TotalDue?: number | null }).TotalDue ?? 0)
                : 0,
          ),
          previous: this.buildTrendSeries(
            previousOrders,
            ranges.previous,
            (order) =>
              sellerForTrend !== null &&
              this.getSellerName(order) === sellerForTrend
                ? Number((order as { TotalDue?: number | null }).TotalDue ?? 0)
                : 0,
          ),
        },
      };
    });
  }

  // --- Métodos Privados de Ayuda ---

private resolveRanges(filter: DashboardFilter) {
    
    const today = new Date('2014-06-30T00:00:00.000Z'); 
    
    const fromInput = filter.from ? this.parseDate(filter.from) : null;
    const toInput = filter.to ? this.parseDate(filter.to) : null;

    let currentFrom = fromInput;
    let currentTo = toInput;

    if (!currentFrom && !currentTo) {
      currentFrom = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      currentTo = today;
    } else if (!currentFrom && currentTo) {
      currentFrom = new Date(
        Date.UTC(currentTo.getUTCFullYear(), currentTo.getUTCMonth(), 1),
      );
    } else if (currentFrom && !currentTo) {
      currentTo = today;
    }

    if (!currentFrom || !currentTo)
      throw new AppError('Invalid date range', 400);
    if (currentFrom > currentTo)
      throw new AppError('from must be earlier than or equal to to', 400);

    const currentToExclusive = this.addDays(currentTo, 1);
    const durationMs = currentToExclusive.getTime() - currentFrom.getTime();

    const previousToExclusive = new Date(currentFrom);
    const previousFrom = new Date(currentFrom.getTime() - durationMs);

    return {
      current: {
        from: currentFrom,
        toInclusive: currentTo,
        toExclusive: currentToExclusive,
      },
      previous: {
        from: previousFrom,
        toInclusive: this.addDays(previousToExclusive, -1),
        toExclusive: previousToExclusive,
      },
      territory: filter.territory,
    };
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

  private async loadMetricOrders<TSelect extends Prisma.SalesOrderHeaderSelect>(
    ranges: { current: DateRange; previous: DateRange; territory?: string },
    select: TSelect,
  ) {
    const [currentOrders, previousOrders] = await Promise.all([
      this.prisma.salesOrderHeader.findMany({
        where: this.buildWhere(ranges.current, ranges.territory),
        select,
      }),
      this.prisma.salesOrderHeader.findMany({
        where: this.buildWhere(ranges.previous, ranges.territory),
        select,
      }),
    ]);
    return [currentOrders, previousOrders] as const;
  }

  private readonly salesOrderSelect = {
    OrderDate: true,
    TotalDue: true,
  } satisfies Prisma.SalesOrderHeaderSelect;
  private readonly orderCountSelect = {
    OrderDate: true,
  } satisfies Prisma.SalesOrderHeaderSelect;
  private readonly activeCustomersSelect = {
    OrderDate: true,
    CustomerID: true,
  } satisfies Prisma.SalesOrderHeaderSelect;

  private readonly topSellerSelect = {
    OrderDate: true,
    TotalDue: true,
    Customer: {
      select: {
        Store: {
          select: {
            SalesPerson: {
              select: {
                Employee: {
                  select: {
                    Person: { select: { FirstName: true, LastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    },
  } satisfies Prisma.SalesOrderHeaderSelect;

  private async withCache<T>(
    key: string,
    producer: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null && cached !== undefined) return cached;

    const value = await producer();
    await this.cache.set(key, value);
    return value;
  }

  private buildCacheKey(
    endpoint: string,
    ranges: { current: DateRange; previous: DateRange; territory?: string },
    filter: DashboardFilter,
  ): string {
    return [
      'dashboard',
      endpoint,
      this.formatDate(ranges.current.from),
      this.formatDate(ranges.current.toInclusive),
      this.formatDate(ranges.previous.from),
      this.formatDate(ranges.previous.toInclusive),
      ranges.territory?.trim() || '-',
      String(Boolean(filter.includeTrend)),
    ].join(':');
  }

  private buildWhere(
    range: DateRange,
    territory?: string,
  ): Prisma.SalesOrderHeaderWhereInput {
    const where: Prisma.SalesOrderHeaderWhereInput = {
      OrderDate: { gte: range.from, lt: range.toExclusive },
    };

    if (!territory) return where;

    const normalizedTerritory = territory.trim();
    if (!normalizedTerritory) return where;

    const territoryFilter = { equals: normalizedTerritory };

    where.OR = [
      {
        SalesTerritory: {
          OR: [
            { Name: territoryFilter },
            { CountryRegionCode: territoryFilter },
            { Group: territoryFilter },
          ],
        },
      },
      {
        Address_SalesOrderHeader_ShipToAddressIDToAddress: {
          OR: [
            { StateProvince: { StateProvinceCode: territoryFilter } },
            { StateProvince: { CountryRegionCode: territoryFilter } },
            { StateProvince: { Name: territoryFilter } },
            { StateProvince: { CountryRegion: { Name: territoryFilter } } },
            { City: territoryFilter },
          ],
        },
      },
      {
        Address_SalesOrderHeader_BillToAddressIDToAddress: {
          OR: [
            { StateProvince: { StateProvinceCode: territoryFilter } },
            { StateProvince: { CountryRegionCode: territoryFilter } },
            { StateProvince: { Name: territoryFilter } },
            { StateProvince: { CountryRegion: { Name: territoryFilter } } },
            { City: territoryFilter },
          ],
        },
      },
    ];

    return where;
  }

  private buildFilterResponse(
    ranges: { current: DateRange; previous: DateRange },
    territory?: string,
  ) {
    return {
      from: this.formatDate(ranges.current.from),
      to: this.formatDate(ranges.current.toInclusive),
      territory: territory ?? null,
      comparedWith: {
        from: this.formatDate(ranges.previous.from),
        to: this.formatDate(ranges.previous.toInclusive),
      },
    };
  }

  private formatDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private sumSales(orders: { TotalDue: number | null }[]): number {
    return orders.reduce((sum, order) => sum + Number(order.TotalDue || 0), 0);
  }

  private uniqueCustomerCount(orders: { CustomerID: number }[]): number {
    return new Set(orders.map((order) => order.CustomerID)).size;
  }

  private buildComparison(current: number, previous: number) {
    const absoluteChange = current - previous;
    const percentageChange =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : (absoluteChange / previous) * 100;

    return {
      previousValue: Number(previous.toFixed(2)),
      absoluteChange: Number(absoluteChange.toFixed(2)),
      percentageChange: Number(percentageChange.toFixed(2)),
    };
  }

  private buildTrendSeries<TOrder extends { OrderDate: Date }>(
    orders: TOrder[],
    range: DateRange,
    valueSelector: (order: TOrder) => number,
  ): TrendPoint[] {
    const labels = this.buildDailyLabels(range);
    const buckets = new Map<string, number>(labels.map((label) => [label, 0]));

    for (const order of orders) {
      const label = this.formatDate(order.OrderDate);
      if (buckets.has(label)) {
        buckets.set(
          label,
          Number((buckets.get(label) ?? 0) + valueSelector(order)),
        );
      }
    }

    let cumulative = 0;
    return labels.map((label, index) => {
      const value = Number((buckets.get(label) ?? 0).toFixed(2));
      cumulative += value;
      return {
        period: label,
        periodIndex: index + 1,
        value,
        cumulativeValue: Number(cumulative.toFixed(2)),
      };
    });
  }

  private buildUniqueCustomerTrendSeries(
    orders: { OrderDate: Date; CustomerID: number }[],
    range: DateRange,
  ): TrendPoint[] {
    const labels = this.buildDailyLabels(range);
    const buckets = new Map<string, Set<number>>(
      labels.map((label) => [label, new Set<number>()]),
    );

    for (const order of orders) {
      const label = this.formatDate(order.OrderDate);
      buckets.get(label)?.add(order.CustomerID);
    }

    let cumulative = 0;
    return labels.map((label, index) => {
      const value = buckets.get(label)?.size ?? 0;
      cumulative += value;
      return {
        period: label,
        periodIndex: index + 1,
        value,
        cumulativeValue: cumulative,
      };
    });
  }

  private buildDailyLabels(range: DateRange): string[] {
    const labels: string[] = [];
    for (
      let date = new Date(range.from);
      date < range.toExclusive;
      date = this.addDays(date, 1)
    ) {
      labels.push(this.formatDate(date));
    }
    return labels;
  }

  private computeTopSeller(orders: any[]): TopSellerData | null {
    if (orders.length === 0) return null;

    const bySeller = new Map<string, { totalSales: number; orders: number }>();

    for (const order of orders) {
      const seller = this.getSellerName(order);
      const current = bySeller.get(seller) ?? { totalSales: 0, orders: 0 };
      current.totalSales += Number(order.TotalDue || 0);
      current.orders += 1;
      bySeller.set(seller, current);
    }

    let topSeller: TopSellerData | null = null;
    for (const [name, metrics] of bySeller.entries()) {
      if (!topSeller || metrics.totalSales > topSeller.totalSales) {
        topSeller = {
          name,
          totalSales: Number(metrics.totalSales.toFixed(2)),
          orders: metrics.orders,
        };
      }
    }
    return topSeller;
  }

  private getSellerName(order: any): string {
    const firstName =
      order.Customer?.Store?.SalesPerson?.Employee?.Person?.FirstName?.trim() ??
      '';
    const lastName =
      order.Customer?.Store?.SalesPerson?.Employee?.Person?.LastName?.trim() ??
      '';
    const seller = `${firstName} ${lastName}`.trim();
    return seller.length > 0 ? seller : 'Unassigned';
  }
}
