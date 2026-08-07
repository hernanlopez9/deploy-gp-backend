# Prisma — Documentación del Proyecto

Documentación técnica del uso de **Prisma ORM** dentro de AdventureWorks API.

Este documento explica cómo está integrado Prisma con el proyecto, cómo se conecta con SQL Server, cómo funciona la base de datos restaurada mediante Docker, qué comandos utilizar durante el desarrollo y qué comandos **NO deben ejecutarse** bajo determinadas circunstancias.

---

# 1. ¿Qué es Prisma?

Prisma es el ORM utilizado por el proyecto para comunicarse con Microsoft SQL Server desde TypeScript.

Su función principal es proporcionar una capa tipada entre la aplicación y la base de datos.

La arquitectura es:

```text
Express
   │
   ▼
Controllers / Services
   │
   ▼
Prisma Client
   │
   ▼
Prisma
   │
   ▼
SQL Server
   │
   ▼
AdventureWorks2022
```

Prisma permite realizar operaciones sobre la base de datos utilizando TypeScript en lugar de escribir directamente todas las consultas SQL.

---

# 2. Prisma dentro de este proyecto

La integración de Prisma se encuentra principalmente en:

```text
AdventureWorks-API/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── generated/
│   └── prisma/
│
├── src/
│   └── db/
│       └── prisma.service.ts
│
└── prisma.config.ts
```

Cada elemento tiene una responsabilidad diferente.

---

# 3. `prisma/schema.prisma`

El archivo:

```text
prisma/schema.prisma
```

es el archivo principal del modelo Prisma.

Aquí Prisma describe las entidades y relaciones que conoce de la base de datos.

Conceptualmente:

```text
SQL Server
    │
    │ introspection
    ▼
schema.prisma
    │
    │ generate
    ▼
Prisma Client
```

---

# 4. `prisma.config.ts`

El proyecto utiliza configuración de Prisma mediante:

```text
prisma.config.ts
```

Este archivo forma parte de la configuración de Prisma CLI.

La configuración permite definir aspectos como:

* Ubicación del schema.
* Configuración de migraciones.
* Configuración de la fuente de datos.
* Variables utilizadas por Prisma.

La configuración exacta debe mantenerse alineada con la versión de Prisma utilizada por el proyecto.

---

# 5. Versión de Prisma

Actualmente el proyecto utiliza:

```text
Prisma CLI 7.9.1
```

Por lo tanto, los comandos y configuración deben considerarse dentro del comportamiento de Prisma 7.

Para comprobar la versión instalada:

```bash
bunx prisma --version
```

---

# 6. Prisma Client

Prisma Client es el cliente generado que utiliza la aplicación para comunicarse con la base de datos.

Se genera mediante:

```bash
bunx prisma generate
```

En este proyecto el cliente se genera en:

```text
generated/prisma
```

Conceptualmente:

```text
schema.prisma
      │
      │ prisma generate
      ▼
generated/prisma
      │
      ▼
Aplicación TypeScript
```

---

# 7. ¿Por qué existe `generated/`?

La carpeta:

```text
generated/
```

contiene código generado automáticamente por Prisma.

Ese código no debe editarse manualmente.

Si se modifica el schema Prisma, normalmente se debe volver a ejecutar:

```bash
bunx prisma generate
```

para actualizar el cliente generado.

---

# 8. Prisma Service

El proyecto contiene:

```text
src/db/prisma.service.ts
```

Este archivo centraliza la utilización de Prisma dentro de la aplicación.

La intención es evitar que cada controller o módulo cree su propia instancia de Prisma.

La arquitectura esperada es:

```text
Controller
    │
    ▼
Service
    │
    ▼
PrismaService
    │
    ▼
Prisma Client
    │
    ▼
SQL Server
```

---

# 9. Base de datos utilizada

La aplicación trabaja con:

```text
AdventureWorks2022
```

La base de datos no se crea originalmente mediante Prisma.

Se obtiene desde un backup:

```text
backups/
└── AdventureWorks2022.bak
```

Este punto es MUY importante.

La base de datos ya contiene:

* Tablas.
* Relaciones.
* Datos.
* Índices.
* Constraints.
* Esquemas.
* Objetos propios de AdventureWorks.

Por esta razón, el proyecto no debe tratar la base como si fuera una base de datos vacía creada por Prisma.

---

# 10. Docker y SQL Server

SQL Server se ejecuta mediante Docker.

El proyecto utiliza:

```text
mcr.microsoft.com/mssql/server:2022-latest
```

La arquitectura de infraestructura es:

```text
Docker Compose
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
sqlserver                db-init
       │                      │
       │                      │
       ▼                      ▼
 SQL Server            RESTORE DATABASE
       │                      │
       └──────────┬───────────┘
                  ▼
          AdventureWorks2022
```

---

# 11. Contenedor SQL Server

El servicio principal se llama:

```text
sqlserver
```

y utiliza:

```text
container_name: sqlserver_adventureworks
```

SQL Server se expone mediante:

```text
1433:1433
```

Por lo tanto, desde la máquina local normalmente se accede mediante:

```text
localhost:1433
```

---

# 12. Credenciales de SQL Server

Docker utiliza credenciales para el usuario `sa`.

Estas credenciales son necesarias para iniciar SQL Server y restaurar la base de datos.

Sin embargo:

> Las credenciales reales NO deben documentarse en el README ni subirlas al repositorio.

Deben mantenerse mediante variables de entorno o una configuración local protegida.

Si el proyecto actualmente tiene una contraseña escrita directamente dentro de `docker-compose.yml`, se recomienda posteriormente migrarla a variables de entorno.

---

# 13. Persistencia de Docker

El servicio SQL Server utiliza un volumen:

```text
sqlserver_data
```

Este volumen está asociado a:

```text
/var/opt/mssql
```

Su objetivo es mantener la información de SQL Server fuera del ciclo de vida temporal del contenedor.

Conceptualmente:

```text
Docker Container
       │
       ▼
SQL Server
       │
       ▼
sqlserver_data
       │
       ▼
Datos persistentes
```

---

# 14. Carpeta `backups`

El proyecto contiene:

```text
backups/
└── AdventureWorks2022.bak
```

Esta carpeta se monta dentro del contenedor:

```text
/var/opt/mssql/backups
```

Por lo tanto:

```text
Proyecto
   │
   └── backups/
         │
         ▼
Docker
         │
         ▼
/var/opt/mssql/backups
```

Esto permite que SQL Server pueda acceder al archivo `.bak`.

---

# 15. Servicio `db-init`

El proyecto utiliza un segundo contenedor para inicializar la base.

Conceptualmente:

```text
sqlserver
   │
   │ healthcheck
   ▼
db-init
   │
   ▼
RESTORE DATABASE
   │
   ▼
AdventureWorks2022
```

El servicio `db-init` espera a que SQL Server esté saludable antes de ejecutar la restauración.

---

# 16. Restauración de AdventureWorks

La restauración utiliza SQL Server:

```sql
RESTORE DATABASE [AdventureWorks2022]
FROM DISK = '/var/opt/mssql/backups/AdventureWorks2022.bak'
```

Además, se utilizan instrucciones `MOVE` para colocar los archivos físicos de la base en:

```text
/var/opt/mssql/data/
```

Por ejemplo:

```text
AdventureWorks2022.mdf
AdventureWorks2022_log.ldf
```

---

# 17. ¿Qué ocurre al levantar Docker?

Cuando se ejecuta:

```bash
docker compose up -d
```

el flujo esperado es:

```text
1. Docker inicia SQL Server
          │
          ▼
2. SQL Server inicia
          │
          ▼
3. Healthcheck comprueba SQL Server
          │
          ▼
4. db-init puede iniciar
          │
          ▼
5. Se ejecuta RESTORE DATABASE
          │
          ▼
6. AdventureWorks2022 queda disponible
```

---

# 18. Verificar Docker

Para comprobar los contenedores:

```bash
docker ps
```

También se pueden consultar los logs:

```bash
docker compose logs
```

Para revisar específicamente el proceso de inicialización:

```bash
docker logs sqlserver_init
```

El objetivo es comprobar que la restauración terminó correctamente.

---

# 19. Detener Docker

Para detener los servicios:

```bash
docker compose down
```

Este comando detiene y elimina los contenedores definidos por Compose.

El comportamiento sobre los volúmenes depende de si se especifica o no la eliminación de estos.

---

# 20. ⚠️ MUY IMPORTANTE: `docker compose down -v`

Existe una diferencia importante entre:

```bash
docker compose down
```

y:

```bash
docker compose down -v
```

El segundo también elimina los volúmenes asociados.

En este proyecto existe:

```text
sqlserver_data
```

Por lo tanto:

> **NO ejecutar `docker compose down -v` sin saber exactamente por qué se necesita.**

Eliminar el volumen puede eliminar la persistencia de SQL Server.

---

# 21. Conexión Prisma → SQL Server

La aplicación utiliza una URL de conexión configurada mediante variables de entorno.

Conceptualmente:

```text
DATABASE_URL
      │
      ▼
Prisma
      │
      ▼
SQL Server
      │
      ▼
AdventureWorks2022
```

La URL debe apuntar a la instancia correcta de SQL Server.

---

# 22. Esquemas de SQL Server

AdventureWorks contiene diferentes schemas.

Entre ellos:

```text
dbo
HumanResources
Person
Production
Purchasing
Sales
```

Prisma puede trabajar con múltiples schemas cuando la configuración del proyecto está preparada para ello.

Por eso es importante no asumir que todas las tablas pertenecen a:

```text
dbo
```

---

# 23. `prisma db pull`

El comando:

```bash
bunx prisma db pull
```

realiza introspección de la base de datos.

Es decir:

```text
SQL Server
     │
     │ analiza tablas
     │ relaciones
     │ columnas
     │ tipos
     ▼
schema.prisma
```

Su función principal es representar una base de datos existente dentro del schema de Prisma.

---

# 24. ¿Cuándo utilizar `db pull`?

Es especialmente útil cuando:

* La base ya existe.
* La base fue creada externamente.
* Se necesita sincronizar el schema Prisma con SQL Server.
* Se agregaron tablas fuera de Prisma.
* Se necesita conocer las relaciones existentes.

En este proyecto es especialmente relevante porque AdventureWorks ya existe antes de Prisma.

---

# 25. ⚠️ `db pull` puede modificar `schema.prisma`

Este punto es crítico.

Ejecutar:

```bash
bunx prisma db pull
```

puede modificar:

```text
prisma/schema.prisma
```

Por eso no se debe ejecutar ciegamente.

Antes de hacerlo:

```bash
git status
```

Después:

```bash
git diff
```

Así se pueden revisar los cambios.

---

# 26. `db pull --force`

Prisma permite:

```bash
bunx prisma db pull --force
```

Este comando puede sobrescribir el schema actual con el resultado de la introspección.

Por lo tanto:

> **NO utilizar `--force` sin tener una copia o commit de los cambios actuales de `schema.prisma`.**

Si existen modificaciones manuales, pueden perderse.

---

# 27. Problema encontrado con `@ignore`

Durante la configuración del proyecto apareció un error relacionado con:

```prisma
@@ignore
```

y relaciones hacia modelos ignorados.

Por ejemplo, Prisma indicó que una relación hacia:

```text
ProductDocument
```

también debía ser ignorada.

El problema general es:

```text
Model A
   │
   ▼
Model B
```

pero:

```text
Model B
@@ignore
```

Si una relación apunta a un modelo ignorado, Prisma exige coherencia en la relación.

---

# 28. `prisma validate`

Antes de generar el cliente, se recomienda validar:

```bash
bunx prisma validate
```

Este comando comprueba que el schema Prisma sea válido.

Flujo recomendado:

```text
Modificar schema
      │
      ▼
prisma validate
      │
      ▼
prisma generate
```

---

# 29. `prisma generate`

El comando:

```bash
bunx prisma generate
```

genera Prisma Client.

Flujo:

```text
schema.prisma
      │
      ▼
prisma generate
      │
      ▼
generated/prisma
```

Este comando no debería modificar directamente la estructura de SQL Server.

Su objetivo es generar el cliente para la aplicación.

---

# 30. `prisma format`

Para formatear el schema:

```bash
bunx prisma format
```

Esto ayuda a mantener:

```text
schema.prisma
```

con formato consistente.

---

# 31. Migraciones

Prisma Migrate está diseñado principalmente para gestionar cambios estructurales mediante migraciones.

Conceptualmente:

```text
Migration 001
Migration 002
Migration 003
       │
       ▼
Database
```

En una aplicación creada desde cero, un flujo típico sería:

```text
schema.prisma
      │
      ▼
prisma migrate dev
      │
      ▼
migration
      │
      ▼
database
```

Pero AdventureWorks presenta una situación diferente.

---

# 32. AdventureWorks NO es una base creada por Prisma

Esta es probablemente la consideración más importante del proyecto.

La base:

```text
AdventureWorks2022
```

ya existe.

Su origen es:

```text
AdventureWorks2022.bak
```

y posteriormente:

```text
Docker
   │
   ▼
SQL Server
   │
   ▼
RESTORE DATABASE
```

Por lo tanto:

```text
Prisma NO creó originalmente la base.
```

---

# 33. ¿Por qué apareció P3005?

Al ejecutar:

```bash
bunx prisma migrate deploy
```

apareció:

```text
Error: P3005

The database schema is not empty.
```

Esto tiene sentido porque Prisma encontró una base que ya contiene objetos.

El flujo era:

```text
prisma migrate deploy
        │
        ▼
Prisma espera controlar migraciones
        │
        ▼
SQL Server ya contiene AdventureWorks
        │
        ▼
P3005
```

---

# 34. Qué significa P3005

P3005 significa, en este contexto:

> Prisma intenta trabajar con migraciones sobre una base cuyo schema ya contiene objetos y que no está siendo tratada como una base inicialmente vacía.

No significa que SQL Server esté roto.

No significa que AdventureWorks esté corrupta.

Significa que hay que definir correctamente cómo Prisma va a reconocer el estado inicial de una base existente.

---

# 35. Baseline

Para una base de datos existente se utiliza el concepto de:

```text
Baseline
```

Un baseline permite decirle a Prisma:

> "Esta base ya existe y este es su estado inicial. No intentes volver a crear todo desde cero."

Conceptualmente:

```text
AdventureWorks existente
          │
          ▼
       Baseline
          │
          ▼
Prisma reconoce estado inicial
          │
          ▼
Migraciones futuras
```

---

# 36. Migraciones futuras

Una vez establecido correctamente el baseline, el objetivo sería:

```text
AdventureWorks existente
        │
        ▼
      Baseline
        │
        ▼
Cambio futuro
        │
        ▼
Migration
        │
        ▼
Database
```

La idea es que Prisma controle los cambios futuros sin intentar recrear AdventureWorks desde cero.

---

# 37. ⚠️ `prisma migrate deploy`

El comando:

```bash
bunx prisma migrate deploy
```

NO debe ejecutarse simplemente porque "hay migraciones".

En este proyecto debe utilizarse únicamente cuando:

1. La estrategia de migraciones esté correctamente definida.
2. El baseline de la base existente esté configurado.
3. Las migraciones hayan sido revisadas.
4. Se sepa exactamente qué cambios aplicará Prisma.

---

# 38. 🚨 COMANDOS QUE NUNCA DEBEMOS EJECUTAR A CIEGAS

Esta sección es especialmente importante para este proyecto.

---

## ❌ `prisma migrate reset`

```bash
bunx prisma migrate reset
```

### NO EJECUTAR.

Este comando está diseñado para resetear la base de datos.

Puede implicar:

```text
DROP
   ↓
Recrear
   ↓
Aplicar migraciones
   ↓
Seed
```

AdventureWorks contiene datos reales del dataset que necesitamos conservar.

Por lo tanto:

> **NO ejecutar `prisma migrate reset` contra la AdventureWorks utilizada por el proyecto.**

---

# 39. ❌ `prisma db push`

```bash
bunx prisma db push
```

No debe ejecutarse sobre AdventureWorks sin comprender exactamente las consecuencias.

`db push` intenta sincronizar el estado del schema Prisma con la base de datos.

Eso puede producir cambios estructurales.

En una base existente y compartida:

> **No utilizar `db push` como mecanismo normal para "actualizar" AdventureWorks.**

---

# 40. ❌ `prisma migrate dev` directamente contra AdventureWorks

```bash
bunx prisma migrate dev
```

No debe utilizarse directamente contra la base restaurada de AdventureWorks como si fuera una base de desarrollo creada desde cero.

`migrate dev` está pensado para el flujo de desarrollo de Prisma Migrate y puede realizar operaciones que no queremos ejecutar accidentalmente sobre esta base existente.

---

# 41. ❌ `prisma migrate deploy` sin baseline

```bash
bunx prisma migrate deploy
```

No debe ejecutarse sobre la base restaurada si todavía no se ha establecido correctamente el baseline.

Eso fue precisamente lo que provocó:

```text
P3005
```

---

# 42. ❌ `prisma db pull --force`

```bash
bunx prisma db pull --force
```

No ejecutar sin respaldo de:

```text
prisma/schema.prisma
```

Puede sobrescribir modificaciones locales.

Antes de utilizarlo:

```bash
git status
```

y:

```bash
git diff
```

---

# 43. ❌ `docker compose down -v`

```bash
docker compose down -v
```

No ejecutar sin saber exactamente qué se está eliminando.

Puede eliminar el volumen:

```text
sqlserver_data
```

y con él la persistencia de SQL Server.

---

# 44. ❌ Eliminar manualmente `sqlserver_data`

No eliminar manualmente el volumen de Docker mientras se necesite conservar la instancia actual.

Antes de eliminarlo hay que entender:

```text
¿Qué contiene?
¿Existe backup?
¿Puede restaurarse?
¿La base será recreada?
```

---

# 45. ❌ Eliminar `AdventureWorks2022.bak`

No eliminar:

```text
backups/AdventureWorks2022.bak
```

sin comprobar que existe otra copia válida.

El `.bak` es la fuente de restauración de la base.

---

# 46. ❌ Editar `generated/prisma`

No modificar manualmente:

```text
generated/prisma
```

Ese código es generado.

Si se necesita cambiar su comportamiento, se debe modificar la configuración o:

```text
schema.prisma
```

y posteriormente ejecutar:

```bash
bunx prisma generate
```

---

# 47. ❌ Editar automáticamente `schema.prisma` sin revisar

El schema es una pieza importante de la aplicación.

Antes de:

```bash
bunx prisma db pull
```

hay que conocer qué cambios locales existen.

Utilizar:

```bash
git status
```

y:

```bash
git diff prisma/schema.prisma
```

---

# 48. Tabla de comandos seguros

| Comando                      | Uso                       | Riesgo                                   |
| ---------------------------- | ------------------------- | ---------------------------------------- |
| `bunx prisma --version`      | Ver versión               | 🟢 Bajo                                  |
| `bunx prisma validate`       | Validar schema            | 🟢 Bajo                                  |
| `bunx prisma generate`       | Generar Client            | 🟢 Bajo                                  |
| `bunx prisma format`         | Formatear schema          | 🟢 Bajo                                  |
| `bunx prisma db pull`        | Introspección             | 🟡 Revisar cambios                       |
| `bunx prisma migrate status` | Revisar migraciones       | 🟢 Bajo                                  |
| `docker ps`                  | Ver contenedores          | 🟢 Bajo                                  |
| `docker compose logs`        | Ver logs                  | 🟢 Bajo                                  |
| `docker compose up -d`       | Levantar servicios        | 🟢 Normal                                |
| `docker compose down`        | Detener servicios         | 🟡 Normal                                |
| `prisma migrate deploy`      | Aplicar migraciones       | 🔴 Solo con estrategia correcta          |
| `prisma migrate dev`         | Desarrollo de migraciones | 🔴 No directamente contra AdventureWorks |
| `prisma db push`             | Sincronizar schema        | 🔴 No usar a ciegas                      |
| `prisma migrate reset`       | Resetear DB               | ⛔ NO                                     |
| `docker compose down -v`     | Eliminar volúmenes        | ⛔ NO a ciegas                            |
| `prisma db pull --force`     | Sobrescribir schema       | ⛔ NO a ciegas                            |

---

# 49. Flujo recomendado para trabajar

El flujo normal de desarrollo debe ser:

```text
1. Levantar Docker
        │
        ▼
2. Comprobar SQL Server
        │
        ▼
3. Comprobar AdventureWorks
        │
        ▼
4. Comprobar DATABASE_URL
        │
        ▼
5. Validar Prisma
        │
        ▼
6. Generar Prisma Client
        │
        ▼
7. Ejecutar API
```

Comandos:

```bash
docker compose up -d
```

Después:

```bash
docker ps
```

Luego:

```bash
bunx prisma validate
```

Y:

```bash
bunx prisma generate
```

Finalmente:

```bash
bun run dev
```

---

# 50. Flujo cuando cambia la base

Si alguien modifica la estructura de SQL Server externamente, por ejemplo:

```text
Nueva tabla
Nueva columna
Nueva relación
```

primero se debe determinar cómo se quiere gestionar ese cambio.

No ejecutar automáticamente:

```bash
prisma db push
```

ni:

```bash
prisma migrate dev
```

Primero hay que decidir:

```text
¿El cambio pertenece al schema real de AdventureWorks?
        │
        ├── Sí
        │    │
        │    ▼
        │  Introspección / migración
        │
        └── No
             │
             ▼
       Revisar diseño
```

---

# 51. Flujo cuando cambia `schema.prisma`

Si se modifica manualmente:

```text
prisma/schema.prisma
```

el flujo recomendado es:

```bash
bunx prisma validate
```

Después:

```bash
bunx prisma generate
```

Y revisar:

```bash
git diff
```

---

# 52. Flujo de introspección

Cuando se necesite volver a leer la estructura real de SQL Server:

```bash
bunx prisma db pull
```

Después revisar:

```bash
git diff prisma/schema.prisma
```

Y posteriormente:

```bash
bunx prisma validate
```

Finalmente:

```bash
bunx prisma generate
```

Flujo completo:

```text
SQL Server
    │
    ▼
prisma db pull
    │
    ▼
schema.prisma
    │
    ▼
prisma validate
    │
    ▼
prisma generate
    │
    ▼
generated/prisma
```

---

# 53. Prisma Studio

Prisma Studio permite explorar los datos mediante una interfaz gráfica.

Comando:

```bash
bunx prisma studio
```

Sin embargo, debe utilizarse con cuidado porque permite visualizar y, dependiendo de la configuración y capacidades disponibles, interactuar con datos.

Para una base compartida o importante:

> No modificar datos desde herramientas gráficas sin saber exactamente qué se está haciendo.

---

# 54. Prisma y SQL directo

Prisma no significa que absolutamente todas las operaciones deban realizarse exclusivamente mediante métodos generados.

En casos específicos puede existir la necesidad de ejecutar SQL.

Pero cualquier SQL directo debe revisarse cuidadosamente.

Especialmente:

```sql
DROP
DELETE
TRUNCATE
ALTER
```

No deben ejecutarse sobre AdventureWorks sin comprender las consecuencias.

---

# 55. Datos y estructura

Hay que distinguir dos cosas:

### Datos

```text
Customers
Products
Orders
etc.
```

### Estructura

```text
Tables
Columns
Indexes
Foreign Keys
Constraints
Schemas
```

Prisma puede representar la estructura mediante:

```text
schema.prisma
```

pero la base real continúa estando en:

```text
SQL Server
```

---

# 56. Fuente de verdad

En este proyecto hay que distinguir entre:

```text
AdventureWorks2022.bak
```

y:

```text
schema.prisma
```

El backup representa una copia de la base de datos.

El schema Prisma representa cómo Prisma conoce esa base.

Por lo tanto:

```text
SQL Server
      │
      │ introspection
      ▼
schema.prisma
      │
      │ generate
      ▼
Prisma Client
```

No se debe asumir automáticamente que modificar `schema.prisma` modifica SQL Server.

---

# 57. Qué hace `generate`

```bash
bunx prisma generate
```

Hace:

```text
schema.prisma
      │
      ▼
Código TypeScript generado
```

No debe confundirse con:

```bash
prisma migrate
```

porque son operaciones diferentes.

---

# 58. Qué hace `db pull`

```bash
bunx prisma db pull
```

Hace:

```text
SQL Server
      │
      ▼
Introspección
      │
      ▼
schema.prisma
```

Es decir, obtiene información de la base y actualiza la representación de Prisma.

---

# 59. Qué hace `migrate`

Las migraciones tienen como objetivo administrar cambios de estructura de la base.

Conceptualmente:

```text
Estado A
   │
   │ migration
   ▼
Estado B
```

Por ejemplo:

```text
Antes:
Customer

Después:
Customer
Address
```

La migración representa el cambio.

---

# 60. Particularidad de este proyecto

La base inicial es:

```text
AdventureWorks2022
```

y proviene de:

```text
AdventureWorks2022.bak
```

Por lo tanto:

```text
No debemos:
    crear AdventureWorks desde Prisma

Debemos:
    conectar Prisma a AdventureWorks existente
```

Después se debe definir correctamente cómo gestionar las modificaciones futuras.

---

# 61. Regla de oro

Antes de ejecutar cualquier comando que pueda modificar la base:

```text
DETENTE
  │
  ▼
¿Este comando modifica SQL Server?
  │
  ├── No → continuar
  │
  └── Sí
       │
       ▼
¿Tenemos backup?
       │
       ├── No → NO ejecutar
       │
       └── Sí
            │
            ▼
       Revisar comando
```

---

# 62. Comandos recomendados para el día a día

Los comandos más habituales y seguros durante el desarrollo son:

```bash
bun install
```

```bash
bunx prisma --version
```

```bash
bunx prisma validate
```

```bash
bunx prisma generate
```

```bash
bunx prisma format
```

```bash
bunx prisma migrate status
```

Y para inspección:

```bash
bunx prisma db pull
```

siempre revisando los cambios posteriores.

---

# 63. Checklist antes de trabajar

Antes de comenzar:

```text
[ ] Docker está ejecutándose
[ ] SQL Server está levantado
[ ] AdventureWorks2022 está disponible
[ ] Existe AdventureWorks2022.bak
[ ] DATABASE_URL está configurada
[ ] Dependencias instaladas
[ ] Prisma Client generado
[ ] schema.prisma válido
```

Comandos:

```bash
docker ps
```

```bash
bunx prisma validate
```

```bash
bunx prisma generate
```

---

# 64. Checklist antes de modificar Prisma

Antes de modificar:

```text
prisma/schema.prisma
```

comprobar:

```bash
git status
```

Después de modificar:

```bash
bunx prisma validate
```

y:

```bash
bunx prisma generate
```

Finalmente:

```bash
git diff
```

---

# 65. Checklist antes de modificar la base

Antes de ejecutar cualquier operación que pueda modificar SQL Server:

```text
[ ] ¿Sé exactamente qué hace el comando?
[ ] ¿Puede modificar tablas?
[ ] ¿Puede eliminar datos?
[ ] ¿Puede modificar relaciones?
[ ] ¿Existe backup?
[ ] ¿Está aprobado el cambio?
[ ] ¿Se puede revertir?
```

Si alguna respuesta no está clara:

> No ejecutar el comando.

---

# 66. Resumen de arquitectura

La integración completa es:

```text
                    ┌──────────────────────┐
                    │       Cliente        │
                    └──────────┬───────────┘
                               │
                               │ HTTP
                               ▼
                    ┌──────────────────────┐
                    │       Express        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Controllers     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Application Logic │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Prisma Service     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Prisma Client     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     SQL Server       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   AdventureWorks     │
                    └──────────────────────┘
```

La infraestructura de base de datos:

```text
                 Docker Compose
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
     SQL Server                  db-init
          │                         │
          │                         │
          │                 AdventureWorks.bak
          │                         │
          └────────────┬────────────┘
                       ▼
                AdventureWorks2022
```

---

# 67. Resumen de comandos

## 🟢 Comandos normales

```bash
bun install
bunx prisma --version
bunx prisma validate
bunx prisma generate
bunx prisma format
bunx prisma migrate status
docker compose up -d
docker ps
docker compose logs
```

## 🟡 Comandos que requieren revisión

```bash
bunx prisma db pull
bunx prisma db pull --force
bunx prisma db push
bunx prisma migrate dev
bunx prisma migrate deploy
docker compose down
```

## 🔴 Comandos que NO deben ejecutarse sobre AdventureWorks sin una razón y procedimiento explícitos

```bash
bunx prisma migrate reset
```

```bash
docker compose down -v
```

Además, **no ejecutar a ciegas**:

```bash
bunx prisma db push
```

```bash
bunx prisma migrate dev
```

```bash
bunx prisma migrate deploy
```

```bash
bunx prisma db pull --force
```

---

# 68. Regla final del proyecto

AdventureWorks es una base de datos existente restaurada desde un backup.

Por ello:

```text
NO tratarla como una base vacía.
```

El flujo correcto es:

```text
AdventureWorks2022.bak
          │
          ▼
        Docker
          │
          ▼
      SQL Server
          │
          ▼
   AdventureWorks2022
          │
          ▼
    Prisma Introspection
          │
          ▼
     schema.prisma
          │
          ▼
    Prisma Client
          │
          ▼
     Express API
```

Y para cambios futuros:

```text
Cambio
  │
  ▼
Revisión
  │
  ▼
Baseline / estrategia de migración
  │
  ▼
Migration
  │
  ▼
SQL Server
```

La prioridad es **no destruir ni modificar accidentalmente la base existente**.

---

# 🚨 REGLA MÁS IMPORTANTE

Antes de ejecutar cualquiera de estos comandos:

```bash
prisma migrate reset
prisma db push
prisma migrate dev
prisma migrate deploy
prisma db pull --force
docker compose down -v
```

**DETENERSE Y REVISAR EL PROCEDIMIENTO.**

No son comandos que deban ejecutarse automáticamente solo porque Prisma los ofrece.

En este proyecto la base de datos ya existe, contiene información y se restaura mediante Docker. Por ello, cualquier operación que pueda modificar su estructura, datos o persistencia debe realizarse de forma controlada.
