export interface DashboardFilter {
  from?: string;
  to?: string;
  territory?: string;
  includeTrend: boolean;
}

export interface DateRange {
  from: Date;
  toInclusive: Date;
  toExclusive: Date;
}

export interface KPIResponse {
  filters: {
    from: string;
    to: string;
    territory: string | null;
    comparedWith: {
      from: string;
      to: string;
    };
  };
  kpi: {
    name: string;
    value: number | object | null;
  };
  comparison: {
    previousValue: number;
    absoluteChange: number;
    percentageChange: number;
  };
  trend?: {
    current: TrendPoint[];
    previous: TrendPoint[];
  };
  previousPeriodTopSeller?: TopSellerData | null;
}

export interface TrendPoint {
  period: string;
  periodIndex: number;
  value: number;
  cumulativeValue: number;
}

export interface TopSellerData {
  name: string;
  totalSales: number;
  orders: number;
}
