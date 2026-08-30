# 🛒 Módulo de Ventas — Sales Module

Módulo encargado de gestionar el ciclo de vida de las **Órdenes de Venta** (`SalesOrderHeader` y `SalesOrderDetail`) en la base de datos **AdventureWorks**.

El módulo está desarrollado siguiendo principios de **Clean Architecture**, con separación de responsabilidades, validación de datos mediante **Zod**, operaciones atómicas mediante **Prisma Transactions** y optimización de consultas mediante **caché**.

---

## 📂 Estructura del módulo

```text
src/modules/sales/
├── controllers/
│   └── sales.controller.ts
│
├── services/
│   └── sales.service.ts
│
├── routes/
│   └── sales.routes.ts
│
├── schemas/
│   └── sales.schemas.ts
│
└── index.ts
```

### Responsabilidad de cada carpeta

| Carpeta / Archivo | Responsabilidad                                       |
| ----------------- | ----------------------------------------------------- |
| `controllers/`    | Recibe las peticiones HTTP y construye las respuestas |
| `services/`       | Contiene la lógica de negocio y acceso a Prisma       |
| `routes/`         | Define los endpoints y middlewares                    |
| `schemas/`        | Define las validaciones utilizando Zod                |
| `index.ts`        | Punto de entrada del módulo, si aplica                |

---

# 🚀 Características principales

## 1. Validación con Zod

Todos los datos recibidos desde la API son validados antes de llegar a la lógica de negocio.

Se validan:

* `params`
* `query`
* `body`

Además, se utiliza coerción de tipos cuando es necesario para convertir correctamente valores provenientes de HTTP.

Ejemplo:

```text
GET /api/sales?page=1&limit=10
```

Los valores recibidos como strings pueden transformarse automáticamente a números mediante los esquemas de Zod.

---

## 2. Transacciones atómicas con Prisma

La creación de una orden de venta se realiza utilizando una transacción de Prisma.

Esto garantiza que:

```text
SalesOrderHeader
       +
SalesOrderDetail
```

se creen correctamente como una única operación.

Si ocurre un error durante la creación de alguno de los detalles, toda la transacción se revierte.

```text
┌─────────────────────┐
│ Crear SalesOrder    │
│      Header         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Crear SalesOrder    │
│      Details        │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
   Éxito      Error
      │         │
      ▼         ▼
   COMMIT    ROLLBACK
```

---

## 3. Caché de consultas

Las consultas de listado de órdenes de venta utilizan caché para reducir consultas innecesarias a la base de datos.

### Configuración

* Duración del caché: **1 minuto**
* Se aplica principalmente al listado `GET /api/sales`.

Cuando se crea una nueva orden, el caché se invalida mediante:

```typescript
bumpSalesCacheVersion()
```

Esto permite que la siguiente consulta obtenga información actualizada.

La respuesta incluye el header:

```http
X-Cache: HIT
```

cuando los datos provienen del caché.

O:

```http
X-Cache: MISS
```

cuando la información tuvo que ser consultada nuevamente.

---

## 4. Cálculo automático de totales

Al crear una orden, el servicio consulta el precio actual (`ListPrice`) de cada producto.

Posteriormente calcula:

```text
LineTotal = OrderQty × UnitPrice × (1 - Discount)
```

y posteriormente:

```text
SubTotal = Σ LineTotal
```

Esto evita que el cliente tenga que enviar manualmente los precios de los productos.

---

# 📡 API Reference

Base URL:

```text
/api/sales
```

---

# 1. 📋 Listar órdenes de venta

Obtiene una lista paginada de órdenes de venta.

La respuesta incluye información adicional relacionada con:

* Cliente
* Vendedor
* Territorio
* Fechas
* Estado
* Totales

### Endpoint

```http
GET /api/sales
```

### Middleware

```typescript
validate(salesOrderFilterSchema, 'query')
```

---

## Query Parameters

Todos los parámetros son opcionales.

| Parámetro     | Tipo     | Descripción                         | Ejemplo                    |
| ------------- | -------- | ----------------------------------- | -------------------------- |
| `page`        | `number` | Página actual. Default: `1`         | `1`                        |
| `limit`       | `number` | Registros por página. Máximo: `100` | `10`                       |
| `customerId`  | `number` | Filtrar por cliente                 | `5`                        |
| `territoryId` | `number` | Filtrar por territorio              | `3`                        |
| `status`      | `number` | Estado de la orden                  | `1`                        |
| `startDate`   | `string` | Fecha inicial ISO 8601              | `2023-01-01T00:00:00.000Z` |
| `endDate`     | `string` | Fecha final ISO 8601                | `2023-12-31T23:59:59.999Z` |

---

## Ejemplo

```http
GET /api/sales?page=1&limit=10&customerId=5
```

---

## Respuesta `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "SalesOrderID": 43659,
      "SalesOrderNumber": "SO43659",
      "OrderDate": "2023-05-31T00:00:00.000Z",
      "DueDate": "2023-06-12T00:00:00.000Z",
      "TotalDue": 23153.23,
      "Status": 5,
      "CustomerName": "John Doe",
      "SalesPersonName": "Pamela Ansman-Wolfe",
      "TerritoryName": "United Kingdom"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 31465,
    "totalPages": 3147,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "appliedFilters": {
      "customerId": 5
    }
  }
}
```

---

# 2. 🔎 Obtener detalle de una orden

Obtiene una orden específica junto con todos sus productos.

### Endpoint

```http
GET /api/sales/:id
```

### Middleware

```typescript
validate(salesOrderIdParamSchema, 'params')
```

---

## Ejemplo

```http
GET /api/sales/43659
```

---

## Respuesta `200 OK`

```json
{
  "success": true,
  "data": {
    "SalesOrderID": 43659,
    "SalesOrderNumber": "SO43659",
    "TotalDue": 23153.23,
    "SubTotal": 20000.00,
    "TaxAmt": 1900.00,
    "Freight": 1253.23,
    "details": [
      {
        "SalesOrderDetailID": 1,
        "ProductID": 776,
        "ProductName": "Mountain-100 Silver, 38",
        "OrderQty": 1,
        "UnitPrice": 3399.99,
        "UnitPriceDiscount": 0,
        "LineTotal": 3399.99
      }
    ]
  }
}
```

---

# 3. ➕ Crear una orden de venta

Crea una orden de venta junto con todos sus productos.

El sistema obtiene automáticamente el precio actual de los productos y calcula los totales.

### Endpoint

```http
POST /api/sales
```

### Middleware

```typescript
validate(createSalesOrderSchema, 'body')
```

### Content-Type

```http
Content-Type: application/json
```

---

## Payload

```json
{
  "customerID": 5,
  "billToAddressID": 18,
  "shipToAddressID": 18,
  "shipMethodID": 5,
  "salesPersonID": 279,
  "territoryID": 1,
  "items": [
    {
      "productID": 776,
      "orderQty": 2,
      "specialOfferID": 1,
      "unitPriceDiscount": 0.10
    },
    {
      "productID": 777,
      "orderQty": 1,
      "unitPriceDiscount": 0
    }
  ]
}
```

---

## Respuesta `201 Created`

```json
{
  "success": true,
  "message": "Orden de venta creada exitosamente",
  "data": {
    "SalesOrderID": 75123,
    "SalesOrderNumber": "SO75123"
  }
}
```

---

# ⚠️ Consideraciones importantes

## Integridad referencial

Los IDs enviados al crear una orden deben existir previamente en la base de datos.

Por ejemplo:

```text
customerID
billToAddressID
shipToAddressID
shipMethodID
salesPersonID
territoryID
productID
specialOfferID
```

Si alguno no existe, la operación puede generar un error de integridad referencial (`Foreign Key`).

---

## Invalidación del caché

Cada vez que se crea una orden correctamente:

```typescript
salesService.create()
```

ejecuta:

```typescript
bumpSalesCacheVersion()
```

Esto invalida las consultas almacenadas en caché para que el siguiente `GET /api/sales` consulte información actualizada.

---

## Impuestos y fletes

Actualmente:

```text
TaxAmt = 0
Freight = 0
```

Esta implementación simplifica la creación de órdenes.

Para una implementación más completa se recomienda integrar:

* `SalesTaxRate`
* Información del territorio
* Métodos de envío
* Reglas de cálculo de impuestos
* Costos de transporte

---

## SpecialOfferID

Cuando no se especifica una oferta especial, el sistema utiliza:

```text
SpecialOfferID = 1
```

Este valor corresponde a la oferta estándar de **No Discount** dentro del esquema de AdventureWorks.

---

# 🧪 Pruebas con Postman / Insomnia

## Obtener órdenes

```http
GET http://localhost:3000/api/sales?page=1&limit=10
```

## Obtener una orden

```http
GET http://localhost:3000/api/sales/43659
```

## Crear una orden

```http
POST http://localhost:3000/api/sales
```

Body:

```json
{
  "customerID": 5,
  "billToAddressID": 18,
  "shipToAddressID": 18,
  "shipMethodID": 5,
  "salesPersonID": 279,
  "territoryID": 1,
  "items": [
    {
      "productID": 776,
      "orderQty": 2,
      "specialOfferID": 1,
      "unitPriceDiscount": 0.1
    }
  ]
}
```

---

# 🛠️ Dependencias

El módulo utiliza las siguientes dependencias principales:

| Dependencia      | Uso                                  |
| ---------------- | ------------------------------------ |
| `zod`            | Validación y transformación de datos |
| `@prisma/client` | ORM y acceso a SQL Server            |
| `cache-manager`  | Gestión de caché                     |
| `express`        | Routing y manejo HTTP                |

---

# 🏗️ Flujo de una petición

## GET `/api/sales`

```text
Cliente
   │
   ▼
Sales Routes
   │
   ▼
Zod Validation
   │
   ▼
Sales Controller
   │
   ▼
Sales Service
   │
   ├──► Cache HIT ──► Response
   │
   └──► Cache MISS
          │
          ▼
       Prisma
          │
          ▼
       Database
          │
          ▼
       Cache
          │
          ▼
       Response
```

---

## POST `/api/sales`

```text
Cliente
   │
   ▼
Sales Routes
   │
   ▼
Zod Validation
   │
   ▼
Sales Controller
   │
   ▼
Sales Service
   │
   ▼
Prisma Transaction
   │
   ├──► Obtener productos
   │
   ├──► Obtener precios
   │
   ├──► Crear SalesOrderHeader
   │
   ├──► Crear SalesOrderDetail
   │
   └──► Calcular totales
   │
   ▼
Commit
   │
   ▼
Invalidar Cache
   │
   ▼
Response 201
```

Si ocurre un error durante la transacción:

```text
Error
  │
  ▼
ROLLBACK
  │
  ▼
No se crea la orden
```

---

# 🔐 Reglas de negocio

El módulo aplica las siguientes reglas:

1. Una orden debe tener al menos un producto.
2. Los productos deben existir en AdventureWorks.
3. Los precios se obtienen desde la base de datos.
4. El total de cada línea se calcula automáticamente.
5. El subtotal se calcula a partir de las líneas.
6. La creación de la cabecera y los detalles debe ser atómica.
7. Los IDs relacionados deben respetar las relaciones existentes en la base de datos.
8. Las consultas de listado utilizan caché.
9. La creación de una orden invalida el caché del listado.
10. `SpecialOfferID = 1` se utiliza como valor predeterminado cuando no se proporciona una oferta.

---

# 📌 Resumen de endpoints

| Método | Endpoint         | Descripción                            |
| ------ | ---------------- | -------------------------------------- |
| `GET`  | `/api/sales`     | Lista órdenes con paginación y filtros |
| `GET`  | `/api/sales/:id` | Obtiene una orden y sus detalles       |
| `POST` | `/api/sales`     | Crea una nueva orden de venta          |

---

# 📚 Tecnologías utilizadas

```text
Node.js
TypeScript
Express
Prisma
SQL Server
Zod
Cache Manager
AdventureWorks
Clean Architecture
```

---

## 📄 Mantenimiento

Este documento pertenece al proyecto **AdventureWorks-API** y debe actualizarse cuando se modifiquen:

* Endpoints
* Schemas de Zod
* Reglas de negocio
* Modelos de Prisma
* Estructura del módulo
* Estrategia de caché
* Respuestas de la API

**Última actualización:** 2026
