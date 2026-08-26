import { prisma } from '../../../db/prisma.service.js'; // Ajusta la extensión a .ts si tu configuración lo requiere
import { createCache } from 'cache-manager';

import type {
  ProductOption,
  ProductListItem,
  ProductOptionsMeta,
} from '../../../shared/types/products.types.js';

// Inicialización del caché en memoria (puedes cambiar 'memory' por 'redis' en producción)
const cache = createCache({
  ttl: 300_000, // 5 minutos en milisegundos
});

let productOptionsCacheVersion = 1;

export class ProductsService {
  async getProductOptions(query: { q?: string; limit: number }) {
    const normalizedQuery = query.q?.trim() ?? '';
    const queryKey = normalizedQuery === '' ? '_' : normalizedQuery;
    const cacheKey = `products:options:v=${productOptionsCacheVersion}:q=${queryKey}:limit=${query.limit}`;

    const cached = await cache.get<{
      data: ProductOption[];
      meta: ProductOptionsMeta;
    }>(cacheKey);

    if (cached) {
      return { ...cached, cacheStatus: 'HIT' as const };
    }

    const products = await prisma.product.findMany({
      where:
        normalizedQuery === ''
          ? undefined
          : {
              OR: [
                { Name: { contains: normalizedQuery } },
                { ProductNumber: { contains: normalizedQuery } },
              ],
            },
      take: query.limit,
      orderBy: [{ Name: 'asc' }, { ProductID: 'asc' }],
      select: {
        ProductID: true,
        Name: true,
        ProductNumber: true,
      },
    });

    const payload = {
      data: products.map((p) => ({
        id: p.ProductID,
        label: `${p.Name} (${p.ProductNumber})`,
      })),
      meta: {
        limit: query.limit,
        query: normalizedQuery,
      },
    };

    await cache.set(cacheKey, payload);

    return { ...payload, cacheStatus: 'MISS' as const };
  }

  async findAll(filter: {
    page: number;
    limit: number;
    name?: string;
    category?: number;
    subcategory?: number;
  }) {
    const { page, limit, name, category, subcategory } = filter;

    // Construcción dinámica del WHERE de Prisma
    const where: any = {};

    if (name) {
      where.Name = { contains: name };
    }

    if (category !== undefined) {
      where.ProductSubcategory = {
        is: {
          ProductCategoryID: category,
        },
      };
    }

    if (subcategory !== undefined) {
      where.ProductSubcategoryID = subcategory;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: [{ ModifiedDate: 'desc' }, { ProductID: 'desc' }],
        select: {
          ProductID: true,
          Name: true,
          ProductNumber: true,
          Color: true,
          ListPrice: true,
          Size: true,
          Weight: true,
          ProductProductPhoto: {
            select: {
              ProductPhoto: {
                select: {
                  ThumbnailPhotoFileName: true,
                },
              },
            },
          },
          SellStartDate: true,
          SellEndDate: true,
          DiscontinuedDate: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    if (products.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: page > 1,
          appliedFilters: {
            name: name ?? null,
            category: category ?? null,
            subcategory: subcategory ?? null,
          },
        },
      };
    }

    const productIds = products.map((p) => p.ProductID);

    // Obtener el máximo descuento aplicado a estos productos
    const discounts = await prisma.salesOrderDetail.groupBy({
      by: ['ProductID'],
      where: {
        ProductID: { in: productIds },
        UnitPriceDiscount: { gt: 0 },
      },
      _max: {
        UnitPriceDiscount: true,
      },
    });

    const maxDiscountByProduct = new Map<number, number>(
      discounts.map((d) => [d.ProductID, d._max.UnitPriceDiscount ?? 0]),
    );

    const now = new Date();

    const data: ProductListItem[] = products.map((product) => {
      const {
        ProductProductPhoto,
        SellStartDate,
        SellEndDate,
        DiscontinuedDate,
        ...publicProduct
      } = product;

      const maxDiscount = maxDiscountByProduct.get(product.ProductID) ?? 0;
      const specialPrice =
        maxDiscount > 0 && product.ListPrice
          ? Number((product.ListPrice * (1 - maxDiscount)).toFixed(2))
          : null;

      const isActiveForSale =
        SellStartDate <= now &&
        (SellEndDate === null || SellEndDate >= now) &&
        DiscontinuedDate === null;

      return {
        ...publicProduct,
        Weight: product.Weight === null ? null : Number(product.Weight),
        ThumbnailPhotoFileName:
          ProductProductPhoto?.[0]?.ProductPhoto?.ThumbnailPhotoFileName ??
          null,
        SpecialPrice: specialPrice,
        IsActiveForSale: isActiveForSale,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        appliedFilters: {
          name: name ?? null,
          category: category ?? null,
          subcategory: subcategory ?? null,
        },
      },
    };
  }

  // Método para invalidar caché cuando se cree/edite un producto en el futuro
  bumpProductOptionsCacheVersion() {
    productOptionsCacheVersion += 1;
  }
}

export const productsService = new ProductsService();
