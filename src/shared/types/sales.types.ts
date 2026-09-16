export interface SalesOrderListItem {
  SalesOrderID: number;
  SalesOrderNumber: string;
  OrderDate: Date;
  DueDate: Date;
  TotalDue: number;
  Status: number;
  CustomerName: string | null;
  SalesPersonName: string | null;
  TerritoryName: string | null;
}

export interface SalesOrderDetailItem {
  SalesOrderDetailID: number;
  ProductID: number;
  ProductName: string;
  OrderQty: number;
  UnitPrice: number;
  UnitPriceDiscount: number;
  LineTotal: number;
}

export interface SalesOrderDetailResponse extends SalesOrderListItem {
  details: SalesOrderDetailItem[];
  SubTotal: number;
  TaxAmt: number;
  Freight: number;
}

export interface CreateSalesOrderDto {
  customerID: number;
  billToAddressID: number;
  shipToAddressID: number;
  shipMethodID: number;
  salesPersonID?: number;
  territoryID?: number;
  creditCardID?: number;
  items: {
    productID: number;
    orderQty: number;
    specialOfferID?: number;
    unitPriceDiscount?: number;
  }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  appliedFilters: {
    customerId?: number;
    territoryId?: number;
    status?: number;
    startDate?: string;
    endDate?: string;
  };
}

export interface CacheStatus {
  cacheStatus: 'HIT' | 'MISS';
}
