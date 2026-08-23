# Módulo de Clientes (AdventureWorks API)

Este módulo gestiona el ciclo de vida completo de los clientes en la base de datos AdventureWorks. Permite el registro seguro de clientes (personas o tiendas), la administración de direcciones, la búsqueda paginada/autocompletado optimizada con caché, y la consulta de historial de compras y métricas acumuladas.

---

## 📂 Estructura del Directorio

```text
src/modules/clients/
├── controllers/
│   └── clients.controller.ts        # Manejo de req/res, validación con Joi y despacho al servicio
├── services/
│   └── clients.service.ts           # Lógica de negocio, transacciones Prisma, hashing y caché
├── routes/
│   └── clients.routes.ts            # Definición de rutas de Express e inyección de dependencias
├── schemas/
│   └── clients.schemas.ts           # Esquemas de validación de datos de entrada y consulta (Joi)
└── index.ts                         # Punto de exportación del módulo
```

---

## 🚀 Características Principales

1. **Registro Transaccional Seguro**: Crea un `Person`, `EmailAddress`, `PersonPhone`, `Password` (hash + salt) y `Customer` (y opcionalmente `Store`) en una sola transacción atómica de Prisma.
2. **Soporte Dual (Persona / Tienda)**: Maneja la lógica condicional para clientes individuales (`IN`) y corporativos (`SC`), validando que las tiendas siempre tengan un `CompanyName`.
3. **Autocompletado de Alto Rendimiento**: Endpoint `/options` con caché en memoria (TTL 10 min) e invalidación automática al crear clientes o direcciones.
4. **Búsqueda Inteligente**: Filtrado dinámico por ID exacto, correo electrónico o nombre (soporta búsqueda por primer nombre, apellido o nombre de tienda).
5. **Gestión de Direcciones Canónicas**: Vincula nuevas direcciones a la entidad de negocio del cliente, validando contra el catálogo real de `StateProvince` y `AddressType`.
6. **Mapeo de Estados de Órdenes**: Traduce los códigos numéricos de estado de AdventureWorks (1-6) a legibles (`Pending`, `Shipped`, `Cancelled`, etc.), aceptando alias en los filtros.

---

## 📡 Endpoints de la API

### 1. Registrar Nuevo Cliente
- **Ruta**: `POST /clients`
- **Descripción**: Crea un nuevo cliente con datos de contacto validados y contraseña hasheada.
- **Body**:
  ```json
  {
    "FirstName": "Juan",
    "LastName": "Perez",
    "EmailAddress": "juan.perez@example.com",
    "PhoneNumber": "3001234567",
    "Password": "MySecurePass123",
    "Type": "Persona",
    "CompanyName": "Mi Empresa S.A." // Obligatorio solo si Type es "Tienda"
  }
  ```

### 2. Autocompletado de Clientes (Combobox)
- **Ruta**: `GET /clients/options`
- **Descripción**: Devuelve una lista ligera de clientes para componentes de autocompletado. Incluye cabecera `X-Cache: HIT|MISS`.
- **Query Params**:
  - `q` (string, opcional): Término de búsqueda (nombre, email o ID).
  - `limit` (number, opcional, default: 10, max: 50).

### 3. Búsqueda Avanzada y Paginada
- **Ruta**: `GET /clients/search`
- **Descripción**: Búsqueda detallada con información completa del cliente, teléfonos y direcciones.
- **Query Params**:
  - `page` (number, default: 1), `limit` (number, default: 10).
  - `id` (number, opcional): Búsqueda exacta por ID.
  - `email` (string, opcional): Búsqueda parcial (case-insensitive).
  - `name` (string, opcional): Búsqueda parcial por nombre o apellido.

### 4. Obtener Direcciones del Cliente
- **Ruta**: `GET /clients/:id/addresses`
- **Descripción**: Lista las direcciones asociadas a la entidad de negocio del cliente (facturación/envío).

### 5. Agregar Dirección al Cliente
- **Ruta**: `POST /clients/:id/addresses`
- **Descripción**: Crea un registro en `Address` y lo vincula mediante `BusinessEntityAddress`.
- **Body**:
  ```json
  {
    "AddressLine1": "742 Evergreen Terrace",
    "City": "Springfield",
    "StateProvince": "Illinois",
    "PostalCode": "62704",
    "CountryRegion": "United States",
    "AddressType": "Shipping"
  }
  ```

### 6. Historial de Órdenes
- **Ruta**: `GET /clients/:id/orders`
- **Descripción**: Historial paginado de órdenes de venta (`SalesOrderHeader`) del cliente.
- **Query Params**:
  - `page`, `limit`.
  - `from`, `to` (formato `YYYY-MM-DD`).
  - `status` (string, opcional): `pending`, `approved`, `backordered`, `rejected`, `shipped`, `cancelled`.

### 7. Total de Compras Acumuladas
- **Ruta**: `GET /clients/:id/orders/total`
- **Descripción**: Resumen KPI con el número total de órdenes y el monto acumulado (`SUM(TotalDue)`).

---

## 📦 Esquema de Respuesta (Ejemplo: Búsqueda)

```json
{
  "data": [
    {
      "CustomerID": 11000,
      "FirstName": "Juan",
      "LastName": "Perez",
      "EmailAddress": "juan.perez@example.com",
      "Phone": "3001234567",
      "Type": "Persona",
      "Addresses": [
        {
          "AddressLine1": "123 Main St",
          "City": "Seattle",
          "StateProvince": "Washington",
          "PostalCode": "98101",
          "CountryRegion": "United States",
          "AddressType": "Billing"
        }
      ],
      "ModifiedDate": "2024-03-11T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## ⚙️ Lógica de Negocio Detallada

### 1. Transacción de Creación (`$transaction`)
Garantiza la integridad referencial. Si falla la creación del `Person`, no se creará el `EmailAddress` ni el `Customer`. El flujo es:
1. Crear `Person` (con `BusinessEntity` anidado).
2. Crear `EmailAddress`, `PersonPhone` y `Password` (usando HMAC-SHA512 + salt aleatorio de 5 bytes).
3. Si es `Tienda`, crear `Store` (con su propio `BusinessEntity`).
4. Crear `Customer` conectando el `Person` (y el `Store` si aplica).

### 2. Estrategia de Caché para Autocompletado
- **TTL**: 600,000 ms (10 minutos).
- **Invalidación**: Se utiliza un contador de versión (`clientOptionsCacheVersion`). Cada vez que se crea un cliente o una dirección, la versión se incrementa (`bumpClientOptionsCacheVersion`), invalidando instantáneamente todas las claves de caché existentes sin necesidad de borrarlas una por una.
- **Clave**: `clients:options:v={version}:q={query}:limit={limit}`.

### 3. Mapeo de Estados de Órdenes
El sistema acepta alias amigables en el query string y los mapea a los códigos enteros de AdventureWorks:
- `pending` / `inprocess` → `1`
- `approved` → `2`
- `backordered` → `3`
- `rejected` → `4`
- `shipped` → `5`
- `cancelled` / `canceled` → `6`

---

## 🛠️ Dependencias del Módulo

Asegúrate de que estas dependencias estén instaladas en tu `package.json`:

```json
{
  "dependencies": {
    "@prisma/client": "^7.9.1",
    "cache-manager": "^7.2.8",
    "express": "^4.19.2",
    "joi": "^18.0.2"
  }
}
```

---

## 🧪 Ejemplos de Uso (cURL)

### Registrar un cliente tipo Tienda
```bash
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -d '{
    "FirstName": "Adventure",
    "LastName": "Bikes",
    "EmailAddress": "contact@adventurebikes.com",
    "PhoneNumber": "555-0199",
    "Password": "SecureBikePass2024",
    "Type": "Tienda",
    "CompanyName": "Adventure Bikes Shop"
  }'
```

### Buscar opciones de autocompletado (con caché)
```bash
curl -i -X GET "http://localhost:3000/clients/options?q=Juan&limit=5"
# Observa la cabecera: X-Cache: MISS (primera vez) o X-Cache: HIT (segunda vez)
```

### Obtener historial de órdenes enviadas en 2014
```bash
curl -X GET "http://localhost:3000/clients/11000/orders?page=1&limit=20&from=2014-01-01&to=2014-12-31&status=shipped"
```

---

## ⚠️ Manejo de Errores

El módulo utiliza la clase `AppError` para respuestas HTTP estandarizadas.

| Código HTTP | Escenario | Mensaje de Ejemplo |
| :--- | :--- | :--- |
| `400` | Validación de Joi fallida | `"CompanyName" is required when Type is Tienda` |
| `400` | Fecha inválida o rango ilógico | `from must be earlier than or equal to to` |
| `400` | Estado de orden no reconocido | `Invalid status. Allowed: pending, approved...` |
| `404` | Cliente no encontrado | `Customer not found` |
| `409` | Email duplicado | `Email address is already registered` |
| `500` | Error de base de datos (Prisma) | `Internal Server Error` |

---

## 📝 Notas para Desarrolladores

1. **Seguridad de Contraseñas**: Las contraseñas **nunca** se almacenan en texto plano. Se usa `crypto.createHmac('sha512', salt)` para generar un hash seguro.
2. **Rendimiento en Búsquedas**: La búsqueda por nombre utiliza `contains` en Prisma. En tablas muy grandes de AdventureWorks, considera agregar índices en `FirstName` y `LastName` si el rendimiento de `searchClients` se degrada.
3. **Consistencia de Direcciones**: Al agregar una dirección, el servicio valida que la combinación `StateProvince` + `CountryRegion` exista en el catálogo de la base de datos antes de intentar la inserción, evitando datos huérfanos o mal escritos.
4. **Singleton**: Al igual que el módulo de Dashboard, el servicio y controlador se instancian una sola vez en `clients.routes.ts`. No instancies `PrismaClient` manualmente dentro de este módulo.
```