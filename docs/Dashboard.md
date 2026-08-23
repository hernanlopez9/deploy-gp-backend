
# Módulo de Dashboard (AdventureWorks API)

Este módulo proporciona endpoints optimizados para la obtención de Indicadores Clave de Desempeño (KPIs) de ventas, conteo de órdenes, clientes activos y mejores vendedores. Está diseñado con una arquitectura limpia, validación estricta, caché en memoria y lógica de negocio compleja para el manejo de rangos de fechas y filtrado territorial en la base de datos AdventureWorks.

---

## 📂 Estructura del Directorio

```text
src/modules/dashboard/
├── controllers/
│   └── dashboard.controller.ts      # Manejo de req/res, validación con Joi y manejo de errores
├── services/
│   └── dashboard.service.ts         # Lógica de negocio, consultas Prisma, cálculos de tendencias y caché
├── routes/
│   └── dashboard.routes.ts          # Definición de rutas de Express e inyección de dependencias (Singleton)
├── schemas/
│   └── dashboard.schemas.ts         # Esquemas de validación de datos de entrada (Joi)
└── index.ts                         # Punto de exportación del módulo
```

---

## 🚀 Características Principales

1. **Cálculo de KPIs en Tiempo Real**: Sumas, conteos y agregaciones sobre `SalesOrderHeader`.
2. **Comparación de Períodos**: Calcula automáticamente el período actual y el período anterior de igual duración para mostrar variaciones absolutas y porcentuales.
3. **Series de Tiempo (Trends)**: Genera datos diarios acumulativos para gráficos, con la opción de desactivarlos (`includeTrend=false`) para optimizar el tamaño de la respuesta.
4. **Filtrado Territorial Inteligente**: Busca coincidencias exactas en el nombre del territorio, código de país, grupo, o en las direcciones de envío/facturación (ciudad, estado, país).
5. **Caché de Alto Rendimiento**: Almacena las respuestas durante 120 segundos (2 minutos) usando `cache-manager` para reducir la carga en SQL Server.
6. **Validación Estricta**: Uso de `Joi` para garantizar que las fechas sean ISO 8601 y los tipos de datos sean correctos antes de ejecutar consultas.

---

## 📡 Endpoints de la API

Todos los endpoints comparten los mismos parámetros de consulta (Query Parameters).

### Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `from` | `string` | No | Fecha de inicio (inclusive) en formato `YYYY-MM-DD`. Por defecto: primer día del mes actual. | `2014-08-01` |
| `to` | `string` | No | Fecha de fin (inclusive) en formato `YYYY-MM-DD`. Por defecto: fecha actual. | `2014-09-01` |
| `territory` | `string` | No | Filtra por nombre de territorio, código de país, grupo, ciudad o estado. | `CA` o `Canada` |
| `includeTrend` | `boolean`| No | Si es `false`, omite los arreglos de tendencias para reducir el payload. Por defecto: `true`. | `false` |

### 1. Resumen de Ventas
- **Ruta**: `GET /dashboard/sales-summary`
- **Descripción**: Obtiene el KPI de ventas totales (`TotalDue`) para el período y territorio, con comparación de tendencia.

### 2. Conteo de Órdenes
- **Ruta**: `GET /dashboard/orders-count`
- **Descripción**: Obtiene el número total de órdenes procesadas en el período, con comparación de tendencia.

### 3. Clientes Activos
- **Ruta**: `GET /dashboard/active-customers`
- **Descripción**: Obtiene el número de clientes únicos (`CustomerID`) que realizaron al menos una compra en el período.

### 4. Mejor Vendedor
- **Ruta**: `GET /dashboard/top-seller`
- **Descripción**: Identifica al vendedor (Persona asociada a la tienda) con el mayor volumen de ventas en el período.

---

## 📦 Esquema de Respuesta (JSON)

Todas las respuestas siguen una estructura estandarizada para facilitar el consumo en el frontend:

```json
{
  "filters": {
    "from": "2014-08-01",
    "to": "2014-09-01",
    "territory": "CA",
    "comparedWith": {
      "from": "2014-07-01",
      "to": "2014-07-31"
    }
  },
  "kpi": {
    "name": "total_sales",
    "value": 125430.50
  },
  "comparison": {
    "previousValue": 100000.00,
    "absoluteChange": 25430.50,
    "percentageChange": 25.43
  },
  "trend": {
    "current": [
      {
        "period": "2014-08-01",
        "periodIndex": 1,
        "value": 1500.00,
        "cumulativeValue": 1500.00
      }
    ],
    "previous": [
      {
        "period": "2014-07-01",
        "periodIndex": 1,
        "value": 1200.00,
        "cumulativeValue": 1200.00
      }
    ]
  }
}
```
*(Nota: El objeto `trend` y `previousPeriodTopSeller` solo se incluyen si `includeTrend=true`)*.

---

## ⚙️ Lógica de Negocio Detallada

### 1. Resolución de Rangos de Fecha (`resolveRanges`)
- Si no se proporcionan fechas, el sistema asume el **mes actual** (día 1 hasta hoy).
- Si solo se proporciona `to`, el `from` se establece como el primer día de ese mes.
- Si solo se proporciona `from`, el `to` se establece como la fecha actual.
- El **período anterior** se calcula restando la duración exacta en milisegundos del período actual a la fecha de inicio (`from`).

### 2. Filtrado Territorial (`buildWhere`)
El filtrado no es una simple coincidencia de texto. Utiliza una cláusula `OR` en Prisma para buscar el término en:
- **Territorio de Venta**: `Name`, `CountryRegionCode`, `Group`.
- **Dirección de Envío (`ShipTo`)**: `City`, `StateProvinceCode`, `CountryRegionCode`, `Name` (Estado), `Name` (País).
- **Dirección de Facturación (`BillTo`)**: Mismos campos que la dirección de envío.
*Optimización*: Se usa `{ equals: normalizedTerritory }` para búsquedas exactas y eficientes, evitando `contains` que provoca escaneos de tabla lentos.

### 3. Cálculo de Tendencias (`buildTrendSeries`)
1. Genera un arreglo de etiquetas de fecha diaria entre el `from` y el `to`.
2. Crea un `Map` para agrupar (bucket) los valores por día.
3. Itera sobre las órdenes, sumando el valor seleccionado (ej. `TotalDue` o `1` para conteo) en su día correspondiente.
4. Calcula el **valor acumulado** (`cumulativeValue`) progresivamente para gráficos de línea ascendente.

### 4. Estrategia de Caché (`withCache`)
- **TTL**: 120,000 ms (2 minutos).
- **Clave de Caché**: Se genera dinámicamente concatenando: `dashboard:{endpoint}:{from}:{to}:{prevFrom}:{prevTo}:{territory}:{includeTrend}`. Esto garantiza que cambios en los filtros invaliden la caché correctamente.

---

## 🛠️ Dependencias del Módulo

Asegúrate de que estas dependencias estén instaladas en tu `package.json`:

```json
{
  "dependencies": {
    "@prisma/client": "^7.9.1",
    "@prisma/adapter-mssql": "^7.4.2",
    "cache-manager": "^7.2.8",
    "express": "^4.19.2",
    "joi": "^18.0.2"
  }
}
```

---

## 🧪 Ejemplos de Uso (cURL)

### Obtener ventas del último mes con tendencias (Comportamiento por defecto)
```bash
curl -X GET "http://localhost:3000/dashboard/sales-summary"
```

### Obtener clientes activos en un rango específico, sin tendencias (Payload ligero)
```bash
curl -X GET "http://localhost:3000/dashboard/active-customers?from=2014-01-01&to=2014-01-31&includeTrend=false"
```

### Filtrar por territorio (ej. Canadá o código de estado CA)
```bash
curl -X GET "http://localhost:3000/dashboard/top-seller?territory=CA"
```

---

## ⚠️ Manejo de Errores

El módulo utiliza la clase `AppError` para respuestas estandarizadas.

| Código HTTP | Escenario | Mensaje de Ejemplo |
| :--- | :--- | :--- |
| `400` | Formato de fecha inválido | `"from must be in YYYY-MM-DD format"` |
| `400` | Rango de fechas ilógico | `"from must be earlier than or equal to to"` |
| `500` | Error de base de datos (Prisma) | `"Internal Server Error"` (Logueado en consola) |

---

## 📝 Notas para Desarrolladores

1. **Prisma Generated**: Antes de ejecutar, asegúrate de que el cliente de Prisma esté generado con los esquemas de AdventureWorks:  
   `npx prisma generate`
2. **Singleton**: El servicio y el controlador se instancian una sola vez en `dashboard.routes.ts`. No instancies `PrismaClient` dentro de los controladores.
3. **Rendimiento en MSSQL**: Las consultas utilizan `findMany` con `select` específico para evitar traer columnas innecesarias (como `Document` o `Xml`). Para datasets masivos, considera agregar índices en `OrderDate` y `CustomerID` si no existen en la BD.
```