# Módulo `orders` — AdventureWorks API

Este documento explica en detalle todo lo que se construyó en el módulo `orders`: qué hace cada archivo, cómo se conecta con la base de datos, y cómo quedó integrado en el resto del proyecto.

---

## 1. ¿Qué es este módulo?

`orders` es el módulo encargado de gestionar las **órdenes de venta** de AdventureWorks. Expone un CRUD completo (crear, leer, actualizar estado, eliminar) sobre la tabla `SalesOrderHeader` (y su tabla relacionada `SalesOrderDetail`) de la base de datos AdventureWorks2022, usando Prisma como ORM.

Se construyó siguiendo **exactamente el mismo patrón arquitectónico** que ya usaba el módulo `sales`: capas separadas de *schemas* (validación), *service* (lógica de negocio + acceso a datos), *controller* (HTTP) y *routes* (definición de endpoints), con clases que se instancian una sola vez (patrón singleton) y se exportan como constante.

A diferencia de `sales` (que solo tenía lectura), `orders` agrega las operaciones de **crear**, **actualizar** y **eliminar**, quedando como el módulo principal de CRUD sobre órdenes.

---

## 2. Estructura de archivos

```
src/modules/orders/
├── controllers/
│   └── orders.controllers.ts
├── middlewares/          (carpeta creada por convención, sin uso propio)
├── models/
│   └── orders.service.ts
├── routes/
│   └── orders.routes.ts
└── schemas/
    └── orders.schemas.ts
```

Cada carpeta tiene una única responsabilidad:

| Carpeta | Responsabilidad |
|---|---|
| `schemas` | Define y valida la forma de los datos que entran por query, params o body |
| `models` | Contiene la clase `OrdersService`: toda la lógica de negocio y las consultas a Prisma |
| `controllers` | Contiene la clase `OrdersController`: recibe la request, llama al service, arma la respuesta HTTP |
| `routes` | Conecta cada endpoint HTTP con su validación y su método del controller |

---

## 3. Modelo de datos

El módulo trabaja directamente sobre los modelos de Prisma generados a partir de las tablas de SQL Server:

- **`SalesOrderHeader`** — la cabecera de la orden: cliente, direcciones, método de envío, vendedor, territorio, fechas, totales y estado.
- **`SalesOrderDetail`** — las líneas de la orden: qué producto, cuántas unidades, precio unitario, descuento y el total de esa línea. Se relaciona con `SalesOrderHeader` por `SalesOrderID`.
- **`Product`** — se consulta al crear una orden, para tomar el precio de lista (`ListPrice`) de cada producto.

Los nombres de los campos respetan el *casing* original de la base de datos AdventureWorks (`CustomerID`, `OrderDate`, `TotalDue`, etc.), tal como los generó Prisma al introspectar el esquema.

---

## 4. `orders.schemas.ts` — Validación con Zod

Este archivo define 4 esquemas de [Zod](https://zod.dev/), cada uno pensado para validar una parte distinta de la request:

### `ordersFilterSchema`
Valida los **query params** del listado (`GET /orders`):

```ts
export const ordersFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  customerId: z.coerce.number().int().min(1).optional(),
  status: z.coerce.number().int().min(1).max(5).optional(),
});
```

- `page` y `limit` controlan la paginación. `z.coerce.number()` convierte automáticamente el string que llega por query (`?page=2`) a número.
- `page` tiene un mínimo de 1 y por defecto es 1 si no se manda.
- `limit` tiene un máximo de 100 para evitar que alguien pida traer toda la tabla de un jalón.
- `customerId` y `status` son opcionales: si no se mandan, no se filtra por ellos.
- `status` está acotado entre 1 y 5, que son los valores válidos de estado en `SalesOrderHeader` (1=En proceso, 2=Aprobada, 3=Enviada parcialmente, 4=Enviada por completo, 5=Cancelada, según el estándar de AdventureWorks).

### `orderIdParamSchema`
Valida el **parámetro de ruta** `:id` que usan `GET /orders/:id`, `PATCH /orders/:id` y `DELETE /orders/:id`:

```ts
export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});
```

Convierte el string de la URL a número entero positivo. Si alguien manda `/orders/abc`, la validación falla antes de llegar al controller.

### `createOrderSchema`
Valida el **body** de `POST /orders` (crear una orden nueva):

```ts
export const createOrderSchema = z.object({
  customerID: z.number().int().min(1),
  billToAddressID: z.number().int().min(1),
  shipToAddressID: z.number().int().min(1),
  shipMethodID: z.number().int().min(1),
  salesPersonID: z.number().int().min(1).optional(),
  territoryID: z.number().int().min(1).optional(),
  creditCardID: z.number().int().min(1).optional(),
  items: z
    .array(
      z.object({
        productID: z.number().int().min(1),
        orderQty: z.number().int().min(1),
        specialOfferID: z.number().int().min(1).default(1),
        unitPriceDiscount: z.number().min(0).max(1).default(0),
      }),
    )
    .min(1, 'La orden debe tener al menos un producto'),
});
```

- Los campos obligatorios son los mínimos que pide `SalesOrderHeader` para poder crear una orden válida: cliente, dirección de facturación, dirección de envío y método de envío.
- `salesPersonID`, `territoryID` y `creditCardID` son opcionales porque en AdventureWorks una orden puede no tener vendedor asignado, territorio, o pago con tarjeta.
- `items` es un arreglo de líneas de la orden. Cada línea necesita el producto y la cantidad. `specialOfferID` (qué oferta especial aplica) y `unitPriceDiscount` (porcentaje de descuento, de 0 a 1) tienen valores por defecto: si no se mandan, se asume "sin oferta especial" (`1`) y "sin descuento" (`0`).
- `.min(1, 'mensaje')` obliga a que la orden tenga por lo menos un producto — no tiene sentido una orden vacía.

### `updateOrderSchema`
Valida el **body** de `PATCH /orders/:id` (actualización parcial):

```ts
export const updateOrderSchema = z.object({
  status: z.number().int().min(1).max(5).optional(),
  customerID: z.number().int().min(1).optional(),
  billToAddressID: z.number().int().min(1).optional(),
  shipToAddressID: z.number().int().min(1).optional(),
  shipMethodID: z.number().int().min(1).optional(),
  salesPersonID: z.number().int().min(1).optional(),
  territoryID: z.number().int().min(1).optional(),
  creditCardID: z.number().int().min(1).optional(),
});
```

Todos los campos son opcionales porque es una actualización **parcial** (estilo PATCH): el cliente solo manda los campos que quiere cambiar. Por ejemplo, para solo cambiar el estado de una orden a "Enviada", basta con mandar `{ "status": 4 }`.

Nota: este schema no permite modificar los `items` de la orden — para eso habría que agregar lógica adicional (borrar detalles viejos y crear nuevos), que no está implementada en la versión actual de `update`.

---

## 5. `orders.service.ts` — Lógica de negocio

La clase `OrdersService` concentra toda la comunicación con la base de datos vía Prisma. Se instancia una sola vez al final del archivo:

```ts
export const ordersService = new OrdersService();
```

Esto sigue el mismo patrón *singleton* que `sales.service.ts`: en vez de crear una instancia nueva cada vez que se necesita, se crea una sola y se reutiliza en toda la aplicación.

### `findAll(filter)`

Lista órdenes con paginación y filtros opcionales.

```ts
async findAll(filter: {
  page: number;
  limit: number;
  customerId?: number;
  territoryId?: number;
  status?: number;
  startDate?: string;
  endDate?: string;
}) {
```

Cómo funciona paso a paso:

1. Arma un objeto `where` vacío y le va agregando condiciones según qué filtros llegaron:
   - Si hay `customerId`, filtra por `CustomerID`.
   - Si hay `territoryId`, filtra por `TerritoryID`.
   - Si hay `status`, filtra por `Status`.
   - Si hay `startDate` y/o `endDate`, arma un rango de fechas sobre `OrderDate` usando `gte` (mayor o igual) y `lte` (menor o igual).
2. Ejecuta **dos consultas en paralelo** con `Promise.all`:
   - `findMany` trae la página pedida (`skip`/`take` calculados a partir de `page` y `limit`), ordenada por `OrderDate` descendente (las más recientes primero).
   - `count` cuenta el total de registros que cumplen el filtro, sin paginar — necesario para calcular cuántas páginas hay en total.
3. Calcula `totalPages`, `hasNextPage` y `hasPreviousPage` para que el cliente sepa cómo navegar la paginación sin tener que hacer esa cuenta él mismo.
4. Devuelve `{ data, meta }`: los datos de la página actual, más la información de paginación.

**Nota:** este método acepta `territoryId`, `startDate` y `endDate`, pero el controller actual (`orders.controllers.ts`) todavía no los está leyendo de `req.query` ni pasándolos al filtro — solo pasa `page`, `limit`, `customerId` y `status`. Si se quiere habilitar el filtro por territorio o por rango de fechas desde la API, hay que agregar esas líneas en `OrdersController.findAll`.

### `findById(id)`

Trae una orden puntual, incluyendo sus líneas de detalle:

```ts
async findById(id: number) {
  const order = await prisma.salesOrderHeader.findUnique({
    where: { SalesOrderID: id },
    include: { SalesOrderDetail: true },
  });
  return order;
}
```

`include: { SalesOrderDetail: true }` le dice a Prisma que traiga también todas las filas relacionadas de la tabla de detalle en la misma consulta (un `JOIN` por debajo). Si no existe la orden, devuelve `null` — el controller es quien decide convertir eso en un 404.

### `create(data)`

El método más largo, porque tiene que calcular montos y crear la cabecera junto con sus líneas de forma atómica. Paso a paso:

1. **Buscar los precios de los productos.** Junta los `productID` de todos los items pedidos y hace una sola consulta (`findMany` con `in`) para traer el `ListPrice` de cada uno, en vez de consultar producto por producto.
2. **Armar un mapa de precios** (`Map<ProductID, ListPrice>`) para poder buscar el precio de cada producto en memoria, rápido, sin volver a golpear la base de datos.
3. **Calcular cada línea de detalle:**
   ```ts
   const lineTotal = item.orderQty * price * (1 - discount);
   ```
   Cantidad × precio × (1 − descuento). Por ejemplo, 10 unidades a $5 con 10% de descuento: `10 * 5 * 0.9 = 45`.
4. **Sumar todas las líneas** en `subTotal`, que es el total de la orden antes de impuestos y flete.
5. **Crear todo dentro de una transacción** (`prisma.$transaction`): la cabecera (`salesOrderHeader.create`) y sus detalles (`SalesOrderDetail: { create: detailsPayload }`) se crean juntos. Si algo falla a mitad de camino, Prisma revierte todo — nunca queda una orden a medias sin sus líneas, o líneas sin orden.
6. Campos que se llenan automáticamente: `SalesOrderNumber` (usa el timestamp actual para generar un número único), `OrderDate` (ahora), `DueDate` (14 días después), `Status: 1` (En proceso), `TaxAmt: 0` y `Freight: 0` (simplificado, no se calculan impuestos ni flete reales), y `TotalDue` (igual al `subTotal`, ya que no hay impuestos ni flete en esta versión).
7. Devuelve la orden creada junto con sus detalles.

### `update(id, data)`

Actualiza los campos editables de una orden existente:

1. Primero verifica que la orden exista (`findUnique` trayendo solo el `SalesOrderID`, para no traer toda la fila innecesariamente).
2. Si no existe, devuelve `null` — el controller lo convierte en 404.
3. Si existe, hace el `update` con los campos que vengan en `data`. Los campos que no se mandan quedan como `undefined`, y Prisma simplemente no los toca (no los pone en `NULL`, los deja como estaban).

**Importante:** este método no modifica los `items`/detalles de la orden, solo los campos de la cabecera (estado, cliente, direcciones, método de envío, vendedor, territorio, tarjeta).

### `delete(id)`

Elimina una orden completa:

1. Verifica que exista (igual que en `update`). Si no, devuelve `null`.
2. Si existe, borra dentro de una transacción **primero los detalles** (`salesOrderDetail.deleteMany`) y **después la cabecera** (`salesOrderHeader.delete`). El orden importa: si se intentara borrar la cabecera primero, la base de datos rechazaría la operación por la relación de llave foránea (una orden no puede desaparecer mientras sus líneas todavía la referencian).
3. Devuelve `true` si se borró correctamente.

---

## 6. `orders.controllers.ts` — Capa HTTP

La clase `OrdersController` traduce entre HTTP y el service. Cada método sigue el mismo patrón: leer la request, llamar al service dentro de un `try/catch`, y responder con el código HTTP correcto. Los errores no manejados se pasan a `next(error)`, que los recoge el middleware global de manejo de errores.

| Método | Qué hace |
|---|---|
| `findAll` | Lee `page`, `limit`, `customerId` y `status` de `req.query`, los convierte a número (o `undefined` si no vienen), llama a `ordersService.findAll`, y responde `200` con `{ success, data, meta }`. |
| `findById` | Convierte `req.params.id` a número; si no es válido responde `400`. Si el service devuelve `null`, responde `404`. Si existe, responde `200` con la orden completa. |
| `create` | Toma `req.body` (ya validado por el middleware `validate`) y lo pasa tal cual a `ordersService.create`. Responde `201` con el `SalesOrderID` y `SalesOrderNumber` de la orden recién creada. |
| `update` | Igual que `findById` en la validación del `id`. Si `ordersService.update` devuelve `null`, responde `404`. Si actualiza bien, responde `200` con la orden actualizada. |
| `remove` | Igual patrón de validación de `id`. Si `ordersService.delete` devuelve `null` (no existía), responde `404`. Si se borró, responde `204` sin contenido (estándar para DELETE exitoso). |

Todas las respuestas de éxito incluyen `success: true` y las de error `success: false` con un `message` descriptivo, para que el frontend pueda distinguir fácilmente el resultado sin depender solo del código HTTP.

---

## 7. `orders.routes.ts` — Definición de endpoints

Este archivo conecta cada ruta HTTP con:
1. El middleware `validate(schema, fuente)` — valida `query`, `params` o `body` según corresponda, usando los schemas de Zod ya explicados. Si la validación falla, la request nunca llega al controller.
2. El método correspondiente de `ordersController`.

```ts
router.get('/', validate(ordersFilterSchema, 'query'), ordersController.findAll);
router.get('/:id', validate(orderIdParamSchema, 'params'), ordersController.findById);
router.post('/', validate(createOrderSchema, 'body'), ordersController.create);
router.patch('/:id', validate(orderIdParamSchema, 'params'), validate(updateOrderSchema, 'body'), ordersController.update);
router.delete('/:id', validate(orderIdParamSchema, 'params'), ordersController.remove);
```

Nota: la ruta `PATCH /:id` usa **dos** validaciones seguidas — primero valida que el `:id` de la URL sea válido, y después valida el body. Si cualquiera de las dos falla, la cadena se corta ahí y el controller nunca se ejecuta.

Al final, el router se exporta por defecto (`export default router;`) para poder importarlo desde el archivo central de rutas.

### Tabla de endpoints

| Método | Ruta | Valida | Descripción |
|---|---|---|---|
| GET | `/api/orders` | query: `ordersFilterSchema` | Lista órdenes paginadas, con filtros opcionales por cliente y estado |
| GET | `/api/orders/:id` | params: `orderIdParamSchema` | Trae una orden con sus líneas de detalle |
| POST | `/api/orders` | body: `createOrderSchema` | Crea una orden nueva con sus productos |
| PATCH | `/api/orders/:id` | params + body | Actualiza campos de la cabecera de una orden existente |
| DELETE | `/api/orders/:id` | params: `orderIdParamSchema` | Elimina una orden y sus líneas |

---

## 8. Integración en el router principal

El módulo se registró en `src/modules/router/route.ts` (el archivo central que arma todas las rutas de la API con `app.use`), siguiendo el mismo patrón que los demás módulos (`sales`, `products`, etc.):

```ts
import OrdersRouter from '../orders/routes/orders.routes';
```

y, junto a las demás líneas de registro:

```ts
app.use('/api/orders', OrdersRouter);
```

Esta línea se agregó **antes** del middleware que captura rutas no encontradas (404), ya que ese middleware corta cualquier request que no haya sido atendida por una ruta anterior.

---

## 9. Ejemplos de uso

### Listar órdenes de un cliente, página 2

```
GET /api/orders?page=2&limit=10&customerId=42
```

```json
{
  "success": true,
  "data": [ /* ...órdenes... */ ],
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 37,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### Crear una orden

```
POST /api/orders
Content-Type: application/json

{
  "customerID": 42,
  "billToAddressID": 100,
  "shipToAddressID": 100,
  "shipMethodID": 1,
  "items": [
    { "productID": 707, "orderQty": 3 },
    { "productID": 708, "orderQty": 1, "unitPriceDiscount": 0.1 }
  ]
}
```

```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "SalesOrderID": 75124,
    "SalesOrderNumber": "SO-1725984123456"
  }
}
```

### Actualizar el estado de una orden

```
PATCH /api/orders/75124
Content-Type: application/json

{ "status": 4 }
```

### Eliminar una orden

```
DELETE /api/orders/75124
```

Responde `204 No Content` si se eliminó correctamente, o `404` si no existía.

---

## 10. Pendientes / posibles mejoras

- Conectar `territoryId`, `startDate` y `endDate` en `OrdersController.findAll`, ya que el service ya los soporta pero el controller todavía no los lee de la query.
- Permitir modificar los `items` de una orden en `update` (por ahora solo se pueden cambiar campos de la cabecera).
- Calcular `TaxAmt` y `Freight` de forma real en `create`, en vez de dejarlos en `0`.
- Agregar manejo explícito de errores con una clase `AppError` (como ya existe en `shared/errors/app-error.ts`) en vez de depender solo del `try/catch` genérico, para dar mensajes más específicos según el tipo de error de Prisma.

---

## 11. Base de datos

El proyecto usa **SQL Server** con la base de datos de ejemplo **AdventureWorks2022**, accedida a través de Prisma. La cadena de conexión vive en la variable `DATABASE_URL` del archivo `.env`, con el formato:

```
DATABASE_URL="sqlserver://HOST:PUERTO;database=AdventureWorks2022;user=USUARIO;password=CONTRASEÑA;trustServerCertificate=true"
```
