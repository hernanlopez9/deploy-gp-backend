export interface ProductOption {
  id: number;
  label: string;
}

export interface ProductListItem {
  ProductID: number;
  Name: string;
  ProductNumber: string;
  Color: string | null;
  ListPrice: number | null;
  Size: string | null;
  Weight: number | null;
  ThumbnailPhotoFileName: string | null;
  SpecialPrice: number | null;
  IsActiveForSale: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  appliedFilters: {
    name: string | null;
    category: number | null;
    subcategory: number | null;
  };
}

export interface ProductOptionsMeta {
  limit: number;
  query: string;
}

export interface CacheStatus {
  cacheStatus: 'HIT' | 'MISS';
}
