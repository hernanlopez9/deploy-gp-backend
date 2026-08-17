```markdown
# 🔐 Módulo de Autenticación — AdventureWorks API

Este documento describe en detalle la implementación del módulo de **autenticación y autorización** para la API de AdventureWorks, desarrollado con **Express + TypeScript + Prisma + PostgreSQL**, siguiendo la arquitectura modular del proyecto.

---

## 📑 Tabla de contenidos

1. [Descripción general](#-descripción-general)
2. [Arquitectura](#-arquitectura)
3. [Estructura de archivos](#-estructura-de-archivos)
4. [Variables de entorno](#-variables-de-entorno)
5. [Modelo de datos](#-modelo-de-datos)
6. [Endpoints](#-endpoints)
7. [Flujo de autenticación](#-flujo-de-autenticación)
8. [Capas del módulo](#-capas-del-módulo)
9. [Seguridad implementada](#-seguridad-implementada)
10. [Cómo probarlo](#-cómo-probarlo)
11. [Extensión a otras rutas](#-extensión-a-otras-rutas)

---

## 🎯 Descripción general

El módulo `auth` gestiona el ciclo completo de autenticación de usuarios:

- **Registro** de nuevos usuarios con contraseña hasheada
- **Inicio de sesión** con validación de credenciales
- **Cierre de sesión** eliminando cookies
- **Renovación de tokens** mediante refresh token
- **Obtención del perfil** del usuario autenticado
- **Cambio de contraseña** validando la contraseña actual

La autenticación se basa en **JWT (JSON Web Tokens)** almacenados en **cookies `httpOnly`**, lo que los hace inaccesibles desde JavaScript del navegador y los protege contra ataques XSS.

---

## 🏗️ Arquitectura

El módulo sigue el **patrón de arquitectura modular** del proyecto, organizado en capas:

```
┌─────────────────────────────────────────────┐
│                 Cliente (HTTP)              │
└──────────────────┬──────────────────────────┘
                   │ cookies httpOnly
                   ▼
┌─────────────────────────────────────────────┐
│         auth.routes.ts (Rutas)              │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌──────────────────┐
│  Middleware  │      │  auth.controller │
│  (auth)      │      │  (capa entrada)  │
└──────────────┘      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  auth.schemas    │  ← Validación Joi
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │   auth.model     │  ← Lógica de negocio
                      │                  │     + acceso a BD
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ Prisma (BD PG)   │
                      └──────────────────┘
```

Cada capa tiene una **responsabilidad única** (principio SRP de SOLID):

| Capa | Responsabilidad |
|------|-----------------|
| **routes** | Definir los endpoints HTTP y asociarlos a sus handlers |
| **middlewares** | Verificar/extraer el JWT de las cookies |
| **controller** | Validar entrada con Joi, orquestar el flujo y responder |
| **schemas** | Definir las reglas de validación de los DTOs |
| **model** | Lógica de negocio, hashing, generación de tokens, acceso a BD |

---

## 📁 Estructura de archivos

```
src/
├── modules/
│   └── auth/
│       ├── controllers/
│       │   └── auth.controller.ts    # Handlers HTTP
│       ├── middlewares/
│       │   └── auth.middleware.ts    # verifyAccessToken, optionalAuth
│       ├── models/
│       │   └── auth.model.ts         # Lógica de negocio + Prisma
│       ├── routes/
│       │   └── auth.routes.ts        # Definición de endpoints
│       ├── schemas/
│       │   └── auth.schemas.ts       # Validaciones con Joi
│       └── index.ts                  # Barrel exports
│
├── shared/
│   ├── types/
│   │   └── auth.types.ts             # JwtPayload, DTOs, AuthRequest
│   ├── config/
│   │   └── config.ts                 # JWT_SECRET, REFRESH_SECRET
│   └── errors/
│       └── app-error.ts              # AppError (ya existente)
│
└── db/
    └── prisma.service.ts             # Cliente Prisma
```

---

## 🔑 Variables de entorno

El módulo requiere las siguientes variables en tu archivo `.env`:

```env
# ─── JWT ──────────────────────────────────────────────
JWT_SECRET=tu_clave_ultra_secreta_para_access_token_muy_larga
REFRESH_SECRET=tu_clave_ultra_secreta_para_refresh_token_diferente

# ─── Cookies ──────────────────────────────────────────
NODE_ENV=development  # "production" activa cookies "secure"

# ─── Base de datos ────────────────────────────────────
DATABASE_URL="postgresql://user:pass@localhost:5432/adventureworks"
DIRECT_URL="postgresql://user:pass@localhost:5432/adventureworks"
```

> ⚠️ **Importante:** `JWT_SECRET` y `REFRESH_SECRET` deben ser **diferentes**. Si se filtra uno, el otro sigue protegido.

---

## 🗄️ Modelo de datos

Esquema de Prisma utilizado (`schema.prisma`):

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @db.VarChar(50)
  email     String   @unique @db.VarChar(100)
  password  String   @db.VarChar(255)
  createdAt DateTime @default(now())

  @@schema("dbo")
}
```

**Decisiones de diseño:**

- `username` + `email` como identificadores únicos del usuario.
- `password` almacenada hasheada con **bcrypt** (12 rondas) → `@db.VarChar(255)` para acomodar el hash completo.
- `createdAt` automático para auditoría.
- Esquema `dbo` para compatibilidad con SQL Server / AdventureWorks.

---

## 🌐 Endpoints

Todos los endpoints están bajo el prefijo **`/api/auth`**.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | ❌ No | Registra un nuevo usuario |
| `POST` | `/api/auth/login` | ❌ No | Inicia sesión y genera tokens |
| `POST` | `/api/auth/logout` | ❌ No | Cierra sesión eliminando cookies |
| `POST` | `/api/auth/refresh` | ❌ No* | Renueva tokens usando refresh cookie |
| `GET` | `/api/auth/profile` | ✅ Sí | Devuelve datos del usuario autenticado |
| `PATCH` | `/api/auth/change-password` | ✅ Sí | Cambia la contraseña del usuario |

> *`/refresh` no requiere `verifyAccessToken` pero sí valida el `refresh_token` de la cookie.

### Ejemplo de respuesta

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "id": 1,
    "username": "juanperez",
    "email": "juan@test.com",
    "createdAt": "2026-08-10T14:30:00.000Z"
  }
}
```

---

## 🔄 Flujo de autenticación

### 1. Registro / Login

```
Cliente                          Servidor
  │                                 │
  │  POST /auth/login               │
  │  {email, password}              │
  │ ───────────────────────────────►│
  │                                 │ 1. Validar con Joi
  │                                 │ 2. Buscar usuario por email
  │                                 │ 3. bcrypt.compare(password)
  │                                 │ 4. Generar JWTs
  │                                 │ 5. Set-Cookie (httpOnly)
  │  200 OK                         │
  │  Set-Cookie: access_token=...   │
  │  Set-Cookie: refresh_token=...  │
  │◄─────────────────────────────── │
  │                                 │
```

### 2. Petición autenticada

```
Cliente                          Servidor
  │                                 │
  │  GET /auth/profile              │
  │  Cookie: access_token=xyz       │
  │ ───────────────────────────────►│
  │                                 │ 1. verifyAccessToken
  │                                 │ 2. jwt.verify(cookie)
  │                                 │ 3. req.user = payload
  │                                 │ 4. AuthModel.getProfile
  │  200 OK + user data             │
  │◄─────────────────────────────── │
```

### 3. Renovación (cuando access_token expira)

```
Cliente                          Servidor
  │                                 │
  │  POST /auth/refresh             │
  │  Cookie: refresh_token=abc      │
  │ ───────────────────────────────►│
  │                                 │ 1. Leer refresh_token
  │                                 │ 2. jwt.verify(REFRESH_SECRET)
  │                                 │ 3. Buscar usuario
  │                                 │ 4. Generar nuevos JWTs
  │  Set-Cookie: nuevos tokens      │
  │◄─────────────────────────────── │
```

---

## 🧱 Capas del módulo

### 📐 Schemas (validación)

Usamos **Joi** para validar los DTOs de entrada con reglas estrictas:

```typescript
export const registerSchema = Joi.object<RegisterDto>({
  username: Joi.string().min(3).max(50).trim().required(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required(),
});
```

**Reglas aplicadas:**
- Email en minúsculas (evita duplicados por case)
- Contraseña con mayúscula, minúscula y número
- `stripUnknown: true` en el controller → descarta campos maliciosos

### 🧠 Model (lógica de negocio)

Contiene toda la lógica sensible:

- **`register()`**: verifica duplicados, hashea con bcrypt, genera tokens
- **`login()`**: busca usuario, compara contraseña, **mensaje genérico** si falla
- **`refresh()`**: verifica refresh token con secreto separado
- **`changePassword()`**: valida contraseña actual, rechaza reutilización

### 🛡️ Middleware (auth)

```typescript
export function verifyAccessToken(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return next(AppError.unauthorized(...));

  const payload = jwt.verify(token, config.JWT_SECRET);
  req.user = payload;  // 👈 disponible en controllers
  next();
}
```

También incluye `optionalAuth` para endpoints mixtos (público + privado).

### 🎮 Controller (orquestador)

Coordina validación → lógica → respuesta:

```typescript
static async login(req, res, next) {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return next(AppError.badRequest(...));

  const result = await AuthModel.login(value);
  AuthController.setTokenCookies(res, result.tokens);

  return res.status(200).json({ success: true, data: result.user });
}
```

---

## 🔒 Seguridad implementada

| Amenaza | Protección |
|---------|-----------|
| **XSS** | Cookies `httpOnly` (no accesibles desde JS) |
| **CSRF** | `sameSite: 'lax'` en cookies |
| **Fuerza bruta** | Bcrypt con 12 rondas (hash lento) |
| **Fuga de tokens** | Access token corto (15 min) + refresh largo (7 días) |
| **Robo de refresh** | Secreto diferente al access token |
| **Enumeración de usuarios** | Mensaje genérico "Credenciales inválidas" |
| **Inyección de campos** | `stripUnknown: true` en Joi |
| **Reutilización de contraseña** | `.invalid(Joi.ref('oldPassword'))` en schema |
| **HTTPS obligatorio en prod** | `secure: true` cuando `NODE_ENV=production` |
| **Transporte seguro** | CORS restringido a orígenes permitidos |

### Configuración de cookies

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,                          // No accesible desde JS
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
  sameSite: 'lax',                         // Protección CSRF básica
  path: '/',                               // Disponible en toda la API
};
```

---

## 🧪 Cómo probarlo

### Con `curl`

```bash
# 1️⃣ Registrar usuario
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"juanperez","email":"juan@test.com","password":"Password123"}'

# 2️⃣ Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"juan@test.com","password":"Password123"}'

# 3️⃣ Ver perfil (usa cookies guardadas)
curl http://localhost:8080/api/auth/profile -b cookies.txt

# 4️⃣ Cambiar contraseña
curl -X PATCH http://localhost:8080/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"oldPassword":"Password123","newPassword":"NewPass456"}'

# 5️⃣ Renovar tokens
curl -X POST http://localhost:8080/api/auth/refresh -b cookies.txt

# 6️⃣ Logout
curl -X POST http://localhost:8080/api/auth/logout -b cookies.txt
```

### Con Postman / Insomnia

1. Crea una colección `Auth`
2. En cada request, ve a la pestaña **Cookies** y verifica que aparezcan `access_token` y `refresh_token` tras el login
3. Las cookies se envían automáticamente en peticiones posteriores al mismo dominio

---

## 🔗 Extensión a otras rutas

Para proteger cualquier ruta de otro módulo (ej: `sales`), solo importa el middleware:

```typescript
// src/modules/sales/routes/sales.routes.ts
import { Router } from 'express';
import { verifyAccessToken } from '../../auth';
import { SalesController } from '../controllers/sales.controller';

const router = Router();

// Ruta pública
router.get('/public', SalesController.getPublic);

// Ruta protegida
router.get('/private', verifyAccessToken, SalesController.getPrivate);

export default router;
```

En el controller accedes al usuario autenticado mediante `req.user`:

```typescript
static async getPrivate(req: AuthRequest, res: Response) {
  const userId = req.user?.sub;
  // ... tu lógica con el userId
}
```

---

## 🚀 Próximos pasos sugeridos

- [ ] **Rate limiting** en `/login` y `/register` (ej: `express-rate-limit`)
- [ ] **Lista negra de refresh tokens** para invalidarlos en logout real
- [ ] **Verificación por email** al registrarse (token temporal)
- [ ] **Recuperación de contraseña** por email (`/forgot-password`, `/reset-password`)
- [ ] **Roles y permisos** (`middleware: requireRole('admin')`)
- [ ] **Auditoría** de logins (tabla `LoginAttempt` con IP, user-agent, timestamp)

---

## 📚 Dependencias añadidas

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.7"
  }
}
```

---

**Última actualización:** 10 de agosto de 2026  
**Autor:** AdventureWorks Team
```