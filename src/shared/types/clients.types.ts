export type ClientType = 'Persona' | 'Tienda';

export interface CreateClientBody {
  FirstName: string;
  LastName: string;
  EmailAddress: string;
  PhoneNumber: string;
  Password: string;
  Type: ClientType;
  CompanyName?: string;
}

export interface CreateAddressBody {
  AddressLine1: string;
  AddressLine2?: string;
  City: string;
  StateProvince: string;
  PostalCode: string;
  CountryRegion: string;
  AddressType: string;
}

export interface SearchClientQuery {
  page: number;
  limit: number;
  id?: number;
  email?: string;
  name?: string;
}

export interface ClientOrdersFilterQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  status?: string;
}

export interface ClientOptionsQuery {
  q?: string;
  limit: number;
}

export interface ClientOptionsResponse {
  data: Array<{ id: number; label: string }>;
  meta: { limit: number; query: string };
  cacheStatus: 'HIT' | 'MISS';
}
