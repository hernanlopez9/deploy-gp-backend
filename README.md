# 🚀 AdventureWorks API

API REST desarrollada con **TypeScript** y **Express.js**, utilizando una arquitectura modular diseñada para mantener el proyecto organizado, fácil de mantener y preparada para incorporar nuevas funcionalidades en el futuro.

> **Estado del proyecto:** En desarrollo.

---

# 📌 ¿Qué es este proyecto?

**AdventureWorks API** es el backend de un proyecto basado en la base de datos y dominio de AdventureWorks.

La aplicación proporciona una API REST mediante la cual diferentes clientes pueden comunicarse con el backend utilizando HTTP.

El proyecto está diseñado con una **arquitectura modular**, de manera que las funcionalidades se puedan incorporar como módulos independientes sin tener que modificar constantemente el núcleo de la aplicación.

Por ejemplo, en el futuro podrían existir módulos como:

```text
modules/
├── sales/
└── users/
```

Cada módulo puede tener su propia lógica, rutas, controladores, validaciones y middleware específico.

---

# 🎯 Objetivos

Los principales objetivos de la arquitectura son:

* Mantener el código organizado.
* Separar responsabilidades.
* Facilitar el mantenimiento.
* Evitar mezclar lógica de diferentes funcionalidades.
* Permitir agregar nuevos módulos fácilmente.
* Centralizar configuraciones comunes.
* Centralizar el manejo de errores.
* Facilitar el trabajo en equipo.
* Mantener una estructura sencilla y comprensible.
* Preparar el proyecto para crecer sin sobrecomplicarlo.

---

# 🧠 ¿Por qué utilizamos una arquitectura modular?

Una API pequeña puede comenzar funcionando perfectamente con pocos archivos:

```text
src/
├── routes.ts
├── controller.ts
└── app.ts
```

Sin embargo, cuando comienzan a aparecer nuevas funcionalidades, esos archivos pueden crecer demasiado.

Por ejemplo:

```text
ventas
usuarios
```

Si toda la lógica estuviera mezclada, el proyecto sería difícil de mantener.

Por eso utilizamos módulos:

```text
modules/
├── sales/
├── users/
└── ...
```

Cada módulo contiene los elementos relacionados con una funcionalidad específica.

---

# 🏗️ Arquitectura general

La aplicación puede entenderse mediante el siguiente flujo:

```text
                  ┌──────────────────┐
                  │     Cliente      │
                  │ Web / Frontend   │
                  └────────┬─────────┘
                           │
                           │ HTTP
                           ▼
                  ┌──────────────────┐
                  │     Express      │
                  │      API         │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │    Middlewares   │
                  │ Globales         │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Router Principal│
                  └────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          ┌───────┐    ┌───────┐    ┌───────┐
          │ Sales │    │ Users │    │ Otros │
          │Module │    │Module │    │Module │
          └───────┘    └───────┘    └───────┘
```

El objetivo es que cada módulo sea responsable de su propia funcionalidad.

---

# 🔄 Flujo de una petición HTTP

Una petición normalmente sigue este recorrido:

```text
Cliente
   │
   │ HTTP Request
   ▼
Express
   │
   ▼
Middlewares globales
   │
   ▼
Router principal
   │
   ▼
Módulo correspondiente
   │
   ▼
Middleware específico
   │
   ▼
Controller
   │
   ▼
Lógica de la funcionalidad
   │
   ▼
Response
   │
   ▼
Cliente
```

Por ejemplo:

```text
GET /api/sales
       │
       ▼
Express
       │
       ▼
Router
       │
       ▼
Sales Routes
       │
       ▼
Sales Controller
       │
       ▼
Procesamiento
       │
       ▼
HTTP Response
```

---

# 🧰 Tecnologías utilizadas

## TypeScript

TypeScript es el lenguaje principal del proyecto.

Se utiliza porque permite agregar tipado estático sobre JavaScript y ayuda a detectar errores durante el desarrollo.

Ventajas principales:

* Tipado estático.
* Mejor autocompletado.
* Interfaces y tipos.
* Mayor seguridad durante el desarrollo.
* Código más fácil de mantener.

---

## Express.js

**Express.js** es el framework utilizado para construir la API HTTP.

Se encarga principalmente de:

* Crear el servidor.
* Recibir peticiones HTTP.
* Definir rutas.
* Ejecutar middleware.
* Procesar respuestas.
* Manejar errores.

Conceptualmente:

```text
HTTP Request
      │
      ▼
   Express
      │
      ├── Middleware
      ├── Router
      └── Controller
      │
      ▼
HTTP Response
```

---

## Node.js / Bun / npm 

El proyecto está desarrollado con JavaScript/TypeScript para ejecutarse en el entorno de servidor.

Durante el desarrollo se utiliza **Bun** para instalar dependencias y ejecutar scripts del proyecto.

Ejemplos:

```bash
bun install
```

```bash
bun run dev
```

---

## Variables de entorno

Las variables de entorno permiten separar la configuración del código fuente.

Por ejemplo:

```env
PORT=3000
NODE_ENV=development
```

Los valores sensibles o específicos de cada entorno no deben escribirse directamente dentro del código.

---

# 📁 Estructura del proyecto

La estructura actual de `src` es:

```text
src/
│
├── app.ts
├── main.ts
│
├── db/
│
├── modules/
│   ├── helpers/
│   ├── middlewares/
│   ├── router/
│   └── sales/
│
└── shared/
    ├── config/
    ├── errors/
    ├── types/
    ├── utils/
    └── valueObjects/
```

---

# 📄 `app.ts`

`app.ts` contiene la configuración principal de Express.

Aquí se configura la aplicación y se registran los elementos generales que necesita el servidor.

Conceptualmente:

```text
app.ts
 │
 ├── Express
 ├── Middlewares
 ├── CORS
 ├── Router
 └── Error Handler
```

Una responsabilidad importante de `app.ts` es preparar la aplicación, pero no necesariamente iniciar el servidor.

---

# 📄 `main.ts`

`main.ts` es el punto de entrada de la aplicación.

Su responsabilidad principal es iniciar el servidor HTTP.

La separación entre:

```text
app.ts
main.ts
```

permite mantener separadas:

* La configuración de Express.
* El inicio del servidor.

Conceptualmente:

```text
main.ts
   │
   ▼
app.ts
   │
   ▼
Express Application
   │
   ▼
HTTP Server
```

---

# 📁 `db/`

La carpeta:

```text
db/
```

está destinada a la comunicación y configuración relacionada con servicios de persistencia o bases de datos.

Actualmente contiene:

```text
db/
└── prisma.service.ts
```

Aunque la implementación concreta de persistencia pueda evolucionar, la idea es mantener esta responsabilidad separada del resto de la aplicación.

---

# 📁 `modules/`

Esta es una de las carpetas más importantes del proyecto.

```text
modules/
```

contiene las funcionalidades principales de la aplicación.

La idea es que cada funcionalidad importante pueda convertirse en un módulo independiente.

Por ejemplo:

```text
modules/
├── sales/
├── purchasing/
└── users/
```

Actualmente existen elementos relacionados con la infraestructura general y un módulo de ventas en desarrollo.

---

# 📁 `modules/router/`

Contiene la configuración del sistema de rutas principal.

Actualmente:

```text
router/
├── index.ts
└── route.ts
```

Su responsabilidad es organizar y registrar las rutas de los diferentes módulos.

Conceptualmente:

```text
Router Principal
      │
      ├── Sales
      ├── Users
      └── Otros módulos
```

Esto evita registrar todas las rutas directamente en `main.ts`.

---

# 📁 `modules/middlewares/`

Contiene middleware que puede ser utilizado de forma general por la aplicación.

Ejemplo:

```text
modules/
└── middlewares/
    └── configMiddlewares.ts
```

Los middleware de este nivel están pensados para configuraciones o comportamientos generales.

---

# 📁 `modules/helpers/`

Contiene helpers utilizados para tareas pequeñas y reutilizables.

Actualmente:

```text
helpers/
├── ConfiguracionErrorHandlers.ts
└── helpersError.ts
```

Un helper es una función o conjunto pequeño de funciones que ayudan a realizar una tarea específica sin representar una parte principal de la lógica de negocio.

Por ejemplo:

```text
Helper
   │
   ├── Formatear información
   ├── Transformar datos
   ├── Procesar un error
   └── Reutilizar una operación
```

### ¿Son obligatorios?

No.

Los helpers deben aparecer cuando realmente existe una necesidad de reutilización.

No se recomienda crear helpers únicamente para llenar una carpeta.

---

# 📁 `modules/sales/`

Esta carpeta representa un módulo funcional de la aplicación.

```text
sales/
├── controllers/
├── middlewares/
├── models/
├── routes/
└── schemas/
```

La intención de esta estructura es mantener todos los elementos relacionados con una funcionalidad dentro de su propio módulo.

En el futuro pueden existir otros módulos siguiendo una estructura similar.

Por ejemplo:

```text
modules/
├── sales/
└── users/
```

Cada uno puede evolucionar de forma independiente.

---

# 📁 `sales/controllers/`

Los controllers reciben y procesan las peticiones HTTP correspondientes al módulo.

Sus responsabilidades principales son:

* Recibir `Request`.
* Procesar parámetros.
* Invocar la lógica necesaria.
* Generar `Response`.
* Utilizar códigos HTTP apropiados.

El controller debe evitar concentrar toda la lógica de la aplicación.

---

# 📁 `sales/routes/`

Define las rutas HTTP específicas del módulo.

Conceptualmente:

```text
Route
  │
  ▼
Controller
  │
  ▼
Procesamiento
```

Una ruta debería encargarse principalmente de conectar un endpoint con su controller.

Ejemplo:

```ts
router.get(
  "/example",
  controller.getExample
);
```

---

# 📁 `sales/middlewares/`

Contiene middleware específico del módulo.

La diferencia con los middleware generales es su alcance.

```text
modules/middlewares/
        │
        ▼
Aplicación completa

sales/middlewares/
        │
        ▼
Solo Sales
```

Esto permite evitar que reglas específicas de un módulo contaminen toda la aplicación.

---

# 📁 `sales/models/`

Esta carpeta está destinada a las estructuras o modelos utilizados específicamente dentro del módulo.

Los modelos representan la información que maneja la funcionalidad.

La implementación concreta puede evolucionar conforme se definan las necesidades del módulo.

---

# 📁 `sales/schemas/`

Los schemas se utilizan para definir y validar la estructura esperada de los datos.

Por ejemplo, una petición puede requerir:

```json
{
  "id": 1,
  "name": "Example"
}
```

Un schema permite verificar que los datos recibidos tengan la estructura esperada antes de procesarlos.

---

# 📁 `shared/`

La carpeta:

```text
shared/
```

contiene elementos que pueden ser utilizados por diferentes partes de la aplicación.

La diferencia principal es:

```text
modules/
   ↓
Código específico de una funcionalidad

shared/
   ↓
Código reutilizable entre funcionalidades
```

---

# 📁 `shared/config/`

Contiene configuraciones generales.

Actualmente:

```text
config/
├── config.ts
└── cors.config.ts
```

Aquí se pueden centralizar configuraciones como:

* Variables de entorno.
* Puerto.
* Configuración general.
* CORS.
* Opciones globales.

---

# 📁 `shared/errors/`

Contiene las estructuras relacionadas con el manejo de errores.

Actualmente:

```text
errors/
└── app-error.ts
```

La idea es tener una forma consistente de representar errores dentro de la aplicación.

Esto permite evitar que cada módulo maneje los errores de una manera completamente diferente.

---

# 📁 `shared/types/`

Contiene tipos TypeScript que pueden ser compartidos por diferentes partes del proyecto.

Por ejemplo:

```ts
export interface Example {
  id: number;
  name: string;
}
```

Si un tipo solamente pertenece a un módulo específico, debería mantenerse dentro de ese módulo.

---

# 📁 `shared/utils/`

Contiene utilidades generales.

Actualmente:

```text
utils/
└── Getnetwork.ts
```

Las utilidades deben ser independientes de una funcionalidad específica.

Una utilidad puede utilizarse desde diferentes módulos sin tener conocimiento de la lógica particular de esos módulos.

---

# 📁 `shared/valueObjects/`

Contiene valores y constantes compartidas.

Actualmente:

```text
valueObjects/
├── ALLOWED_HEADERS.ts
├── ALLOWED_METHODS.ts
├── index.ts
├── OPTIONAL_VARS.ts
└── REQUIRED_VARS.ts
```

Su objetivo es centralizar valores utilizados en diferentes partes de la aplicación.

Esto ayuda a evitar:

```ts
"GET"
"POST"
"Content-Type"
```

repetidos directamente por todo el código.

---

# 🧩 Middleware

Los middleware de Express funcionan como una cadena de procesamiento.

Por ejemplo:

```text
HTTP Request
     │
     ▼
┌─────────────┐
│ CORS        │
└──────┬──────┘
       ▼
┌─────────────┐
│ JSON Parser │
└──────┬──────┘
       ▼
┌─────────────┐
│ Middleware  │
│ adicional   │
└──────┬──────┘
       ▼
┌─────────────┐
│ Router      │
└──────┬──────┘
       ▼
┌─────────────┐
│ Controller  │
└──────┬──────┘
       ▼
HTTP Response
```

Cada middleware puede:

1. Modificar la petición.
2. Agregar información.
3. Validar información.
4. Ejecutar una acción.
5. Detener la petición.
6. Pasar el control al siguiente middleware.

---

# 🔀 Router

El router funciona como el sistema que decide qué parte de la aplicación debe atender una petición.

Por ejemplo:

```text
GET /api/sales
        │
        ▼
Router
        │
        ▼
Sales Module
```

Mientras que en el futuro:

```text
GET /api/users
        │
        ▼
Router
        │
        ▼
users Module
```

El router permite que el crecimiento de la aplicación sea organizado.

---

# 📦 Modularidad

Una de las principales características del proyecto es la modularidad.

Un módulo debe concentrar las piezas necesarias para una funcionalidad.

Ejemplo:

```text
sales/
├── controllers/
├── middlewares/
├── models/
├── routes/
└── schemas/
```

Si posteriormente se agrega inventario:

```text
modules/
├── sales/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── schemas/
│
└── users/
    ├── controllers/
    ├── middlewares/
    ├── models/
    ├── routes/
    └── schemas/
```

El módulo de inventario no necesita modificar toda la estructura de Sales.

---

# ⭐ ¿Por qué esta estructura?

## 1. Separación de responsabilidades

Cada carpeta tiene una responsabilidad concreta.

```text
routes       → Rutas
controllers  → HTTP
middlewares  → Procesamiento intermedio
schemas      → Validación
models       → Estructuras de datos
shared       → Código reutilizable
config       → Configuración
```

---

## 2. Modularidad

Las funcionalidades están agrupadas.

```text
Sales
Users
```

pueden evolucionar independientemente.

---

## 3. Mantenibilidad

Cuando se necesita modificar una funcionalidad, el desarrollador sabe dónde buscar.

Por ejemplo:

```text
Problema en una ruta
      ↓
modules/<modulo>/routes

Problema con validación
      ↓
modules/<modulo>/schemas

Problema con HTTP
      ↓
modules/<modulo>/controllers
```

---

## 4. Escalabilidad

El proyecto puede crecer agregando nuevos módulos:

```text
modules/
├── sales/
└── users/
```

sin convertir `src` en una colección de archivos difíciles de mantener.

---

## 5. Reutilización

El código que no pertenece a un módulo específico puede colocarse en:

```text
shared/
```

Esto evita duplicación.

---

# 🧭 Regla para decidir dónde colocar código

Una regla sencilla para el equipo:

### ¿Solo lo utiliza un módulo?

Colócalo dentro del módulo.

```text
modules/sales/
```

### ¿Lo utilizan varios módulos?

Considera colocarlo en:

```text
shared/
```

### ¿Es una configuración global?

Utiliza:

```text
shared/config/
```

### ¿Es una ruta?

Utiliza:

```text
routes/
```

### ¿Es lógica HTTP?

Utiliza:

```text
controllers/
```

### ¿Es una validación?

Utiliza:

```text
schemas/
```

### ¿Es una función pequeña reutilizable?

Considera:

```text
helpers/
```

o:

```text
utils/
```

dependiendo de su responsabilidad.

---

# 🆚 Helpers vs Utils

Aunque ambos pueden parecer similares, se recomienda mantener una diferencia conceptual.

### Helper

Una función pequeña que ayuda a realizar una tarea concreta.

```text
helpers/
```

Ejemplo conceptual:

```ts
formatError(error)
```

### Utility

Una utilidad más general y reutilizable.

```text
utils/
```

Ejemplo conceptual:

```ts
getNetworkAddress()
```

No es necesario crear una carpeta nueva para cada pequeña función.

---

# 🔐 Configuración y secretos

Los valores sensibles no deben almacenarse directamente en el código.

Incorrecto:

```ts
const password = "mi-password";
```

Correcto:

```ts
const password = process.env.PASSWORD;
```

Las variables deben mantenerse en `.env`.

El archivo `.env` debe estar incluido en `.gitignore`.

Para compartir la estructura de configuración se recomienda:

```text
.env.example
```

---

# 🛡️ Manejo de errores

La aplicación utiliza una estrategia centralizada para el manejo de errores.

La idea general es:

```text
Error
  │
  ▼
Application Error
  │
  ▼
Error Handler
  │
  ▼
HTTP Status
  │
  ▼
JSON Response
```

Esto permite que los errores tengan respuestas consistentes.

Ejemplo conceptual:

```json
{
  "status": 404,
  "message": "Resource not found"
}
```

La estructura exacta de la respuesta depende de la implementación del proyecto.

---

# 🌐 CORS

CORS permite controlar qué aplicaciones externas pueden comunicarse con la API.

La configuración se encuentra en:

```text
shared/config/cors.config.ts
```

Esto resulta especialmente importante cuando el frontend y backend se ejecutan en diferentes dominios o puertos.

Ejemplo:

```text
Frontend
http://localhost:5173
       │
       │ HTTP
       ▼
Backend
http://localhost:3000
```

---

# 📚 Buenas prácticas

El proyecto busca seguir las siguientes prácticas:

* Mantener funciones pequeñas.
* Evitar duplicación de código.
* Separar responsabilidades.
* Utilizar TypeScript correctamente.
* Validar los datos de entrada.
* Centralizar errores.
* Mantener configuraciones separadas del código.
* Mantener los módulos independientes.
* Utilizar nombres descriptivos.
* Evitar archivos gigantes.
* No colocar lógica de negocio dentro de las rutas.
* No colocar toda la aplicación dentro de los controllers.

---

# 🚫 Qué evitar

## No colocar toda la lógica en las rutas

Evitar:

```ts
router.get("/example", async (req, res) => {

  // 100 líneas de lógica...

});
```

Preferir:

```ts
router.get(
  "/example",
  controller.getExample
);
```

---

## No colocar todo en `shared`

`shared` no debe convertirse en una carpeta donde se coloca cualquier archivo que no sabemos dónde poner.

Si algo pertenece claramente a un módulo:

```text
modules/<module>/
```

debe permanecer ahí.

---

## No crear helpers innecesarios

No todo necesita convertirse en un helper.

Si una función solamente se utiliza una vez y pertenece claramente a un módulo, puede permanecer junto a ese código.

---

# 🧪 Testing

Las pruebas deben mantenerse separadas del código de producción.

Una estructura posible es:

```text
test/
├── unit/
├── integration/
└── ...
```

La estructura definitiva dependerá de las necesidades del proyecto.

El objetivo es poder comprobar:

* Controllers.
* Validaciones.
* Funcionalidades.
* Middleware.
* Integración con servicios externos.

---

# 🚀 Instalación

## 1. Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
```

## 2. Entrar al proyecto

```bash
cd AdventureWorks-API
```

## 3. Instalar dependencias

```bash
bun install
```

## 4. Configurar variables de entorno

Crear:

```text
.env
```

utilizando como referencia:

```text
.env.example
```

## 5. Ejecutar el proyecto

Utilizar el script correspondiente definido en `package.json`.

Por ejemplo:

```bash
bun run dev
```

---

# 🛠️ Scripts

Los scripts disponibles dependen del `package.json`.

Ejemplos habituales:

```bash
bun run dev
bun run build
bun run start
bun run test
```

Consultar siempre el `package.json` para conocer los scripts disponibles en la versión actual del proyecto.

---

# 📂 Estructura completa actual

```text
AdventureWorks-API/
│
├── src/
│   │
│   ├── app.ts
│   ├── main.ts
│   │
│   ├── db/
│   │   └── prisma.service.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── helpers/
│   │   │   ├── ConfiguracionErrorHandlers.ts
│   │   │   └── helpersError.ts
│   │   │
│   │   ├── middlewares/
│   │   │   └── configMiddlewares.ts
│   │   │
│   │   ├── router/
│   │   │   ├── index.ts
│   │   │   └── route.ts
│   │   │
│   │   └── sales/
│   │       ├── controllers/
│   │       ├── middlewares/
│   │       ├── models/
│   │       ├── routes/
│   │       └── schemas/
│   │
│   └── shared/
│       │
│       ├── config/
│       │   ├── config.ts
│       │   └── cors.config.ts
│       │
│       ├── errors/
│       │   └── app-error.ts
│       │
│       ├── types/
│       │
│       ├── utils/
│       │   └── Getnetwork.ts
│       │
│       └── valueObjects/
│           ├── ALLOWED_HEADERS.ts
│           ├── ALLOWED_METHODS.ts
│           ├── index.ts
│           ├── OPTIONAL_VARS.ts
│           └── REQUIRED_VARS.ts
│
├── prisma/
├── generated/
├── backups/
├── test/
│
├── docker-compose.yml
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

---

# 📈 Crecimiento futuro

La arquitectura está preparada para incorporar nuevos módulos.

Actualmente:

```text
modules/
└── sales/
```

En el futuro podría evolucionar a:

```text
modules/
├── sales/
└── users/
```

Cada módulo puede mantener sus propias:

```text
controllers/
middlewares/
models/
routes/
schemas/
```

mientras que las funcionalidades realmente compartidas permanecen en:

```text
shared/
```

---

# 🧩 Principio principal

La regla principal de la arquitectura es:

> **Cada parte del proyecto debe tener una responsabilidad clara.**

En términos simples:

```text
Express
   │
   ├── Recibe peticiones
   │
   ├── Middlewares
   │
   ├── Router
   │
   └── Módulos
          │
          ├── Controllers
          ├── Routes
          ├── Schemas
          ├── Models
          └── Middlewares

Shared
   │
   ├── Configuración
   ├── Errores
   ├── Types
   ├── Utils
   └── Values
```

Esto permite que el proyecto sea fácil de entender incluso para un desarrollador que se incorpore posteriormente.

---

# 👥 Trabajo en equipo

La estructura también facilita la distribución del trabajo.

Por ejemplo:

```text
Desarrollador A
└── modules/sales/

Desarrollador B
└── modules/users/

Desarrollador C
└── shared/

Desarrollador D
└── middlewares / router
```

Esto reduce la posibilidad de que todos tengan que modificar los mismos archivos constantemente.

---

# 📌 Resumen

**AdventureWorks API** utiliza una arquitectura modular sobre Express y TypeScript.

La aplicación separa:

```text
Configuración
     +
Routing
     +
Middleware
     +
Controllers
     +
Módulos
     +
Código compartido
```

La arquitectura está diseñada para ser:

* Simple.
* Clara.
* Modular.
* Mantenible.
* Reutilizable.
* Extensible.

El proyecto puede comenzar con pocos módulos y crecer progresivamente sin necesidad de reorganizar toda la aplicación.

---

# 📄 Documentación adicional

A medida que el proyecto avance, se recomienda agregar documentación específica para:

* API endpoints.
* Modelos de datos.
* Validaciones.
* Autenticación.
* Autorización.
* Base de datos.
* Pruebas.
* Despliegue.

El presente README funciona como **documentación general de la arquitectura y organización del proyecto**.

---

## 👨‍💻 Estado del proyecto

```text
🚧 En desarrollo
```

La arquitectura y los módulos pueden evolucionar conforme se definan nuevas funcionalidades.

## 👨‍💻 Autor

Desarrollado por el equipo de Adventureworks de la UNAC.


<p align="center">
  Hecho con ❤️ por Angel Luna, Jose Granados, Giselle Caicedo y  Hernán López  </a> 
</p>