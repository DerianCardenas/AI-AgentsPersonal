# Proyecto: SaaSFinancial — Sistema de Finanzas Personales Multiusuario

## Descripción general

Sistema web para la gestión integral de finanzas personales que permite a usuarios registrar ingresos y gastos, categorizarlos y visualizarlos mediante dashboards dinámicos con métricas agregadas y filtros avanzados. Evoluciona a un modelo multiusuario mediante organizaciones donde múltiples usuarios comparten datos dentro de un mismo contexto con aislamiento lógico. Incluye auditoría completa de acciones, análisis avanzado con tendencias mensuales y comparativas, e integración opcional con ChatGPT para generar insights automáticos sobre patrones de gasto.

## Siglas del proyecto

SIGLAS: SAASF

## Usuarios del sistema

- **Propietario de Organización (Owner)**: Control total de la organización, gestión de miembros, configuración de acceso, visualización de todos los datos
- **Administrador (Admin)**: Gestión de miembros, configuración de la organización, acceso a todos los datos
- **Miembro (Member)**: Registro de transacciones propias, visualización de datos compartidos de la organización, acceso a reportes
- **Visualizador (Viewer)**: Solo lectura de reportes y dashboards de la organización

---

## Stack tecnológico

### Frontend
Vue 3 + TypeScript + Quasar Framework + Pinia (gestión de estado) + Vue Router + Chart.js para gráficos

### Backend
.NET 8 / C# + Entity Framework Core + Clean Architecture (Domain, Application, Infrastructure, API) + JWT para autenticación + Middleware de auditoría

### Base de datos
PostgreSQL 15+

### Testing
- Unitarias Backend: xUnit + Moq
- Unitarias Frontend: Vitest + Vue Test Utils
- Integración: Vitest + MSW (Mock Service Worker)
- E2E: Playwright

### Otros
- Autenticación: JWT (Access Token + Refresh Token)
- IA: ChatGPT API para insights automáticos sobre gasto
- Auditoría: Middleware que registra acciones en tabla audit_logs
- Relaciones: Usuarios ↔ Organizaciones (muchos a muchos), Transacciones ↔ Categorías (muchos a uno)

---

## Repositorios

back-repo:  /home/derian/Documentos/DerianProyectos/05-SaaSFinancial/Backend
front-repo: /home/derian/Documentos/DerianProyectos/05-SaaSFinancial/Frontend
db-repo:    /home/derian/Documentos/DerianProyectos/05-SaaSFinancial/BD
test-repo:  /home/derian/Documentos/DerianProyectos/05-SaaSFinancial/Test

---

## Estructura de carpetas

### back-repo/
```
src/
  Domain/
    Entities/        → User, Organization, Transaction, Category, AuditLog
    Events/          → eventos de dominio
    ValueObjects/    → Enums de Role, TransactionType, etc
  Application/
    DTOs/            → request/response models
    Services/        → lógica de casos de uso
    Mappers/         → mapeo Entity → DTO
    Validators/      → validación de reglas de negocio
  Infrastructure/
    Persistence/     → EF Core DbContext, Repositories
    Identity/        → autenticación JWT
    ChatGPT/         → integración OpenAI
    Audit/           → middleware y servicio de auditoría
  API/
    Controllers/     → TransactionsController, CategoriesController, etc
    Middlewares/     → autenticación, auditoría, manejo de errores
    Extensions/      → configuración de servicios
tests/
  Unit/              → pruebas de servicios y validaciones
  Integration/       → pruebas con BD simulada
```

### front-repo/
```
src/
  components/
    common/          → componentes reutilizables (Card, Modal, etc)
    dashboard/       → componentes específicos del dashboard
  views/
    Dashboard.vue    → vista principal con gráficos
    Transactions.vue → listado y creación de transacciones
    Categories.vue   → gestión de categorías
    Organization.vue → configuración de la organización
    Reports.vue      → reportes y análisis
  stores/
    auth.ts          → estado de autenticación (Pinia)
    transactions.ts  → estado de transacciones
    organization.ts  → estado de la organización
  services/
    api.ts           → cliente HTTP con interceptores JWT
    auth.ts          → lógica de login/logout
  router/
    index.ts         → definición de rutas protegidas
tests/
  unit/              → pruebas de componentes y stores
  integration/       → pruebas con mock del API
```

### db-repo/
```
migrations/
  001_initial_schema.sql       → usuarios, organizaciones, roles
  002_transactions_schema.sql  → transacciones, categorías
  003_audit_schema.sql         → tabla audit_logs
  004_indexes.sql              → índices de performance
seeds/
  initial_data.sql             → datos de prueba (categorías estándar)
docs/
  ER_diagram.md                → diagrama entidad-relación
  queries_optimization.md      → consultas críticas y su optimización
```

### test-repo/
```
e2e/
  auth.spec.ts                 → login, logout, refresh token
  transactions.spec.ts         → crear, editar, filtrar transacciones
  dashboard.spec.ts            → cargar dashboard, filtros, gráficos
  organization.spec.ts         → gestión de miembros, roles
regression/
  suite.ts                      → pruebas de regresión entre sprints
```

---

## Convenciones de código

### Nomenclatura — Base de datos
- snake_case para tablas y columnas
- Prefijo `tbl_` opcional para tablas (ej: tbl_user, tbl_organization)
- Prefijo `idx_` para índices
- Prefijo `uc_` para unique constraints
- Prefijo `fk_` para foreign keys

### Nomenclatura — Backend
- PascalCase para clases, interfaces, enums
- camelCase para métodos, variables, propiedades
- Sufijos: Service, Repository, Dto, Validator, Controller
- Métodos: Get*, Create*, Update*, Delete*, List*

### Nomenclatura — Frontend
- PascalCase para componentes Vue
- camelCase para métodos y variables
- Prefijo `The` para componentes únicos (TheNavbar, TheSidebar)
- Prefijo `use` para composables (useAuth, useTransactions)
- Archivos de stores: camelCase.ts (authStore.ts, transactionStore.ts)

---

## Reglas de negocio importantes

1. **Aislamiento organizacional**: Un usuario solo ve datos de organizaciones donde es miembro
2. **Roles y permisos**: Owner > Admin > Member > Viewer — roles definen qué puede hacer cada usuario
3. **Transacciones**: Solo se pueden registrar en organizaciones donde el usuario tiene acceso
4. **Auditoría**: TODOS los cambios en transacciones, usuarios y configuración se registran automáticamente
5. **Categorías**: Por defecto hay categorías estándar (Salario, Comida, Transporte, etc) que pueden ser extendidas
6. **Cambio de contraseña**: Requiere confirmación por email
7. **Tokens JWT**: Access Token = 15 min, Refresh Token = 7 días
8. **Eliminación suave (Soft Delete)**: Usuarios y organizaciones inactivas no se eliminan físicamente
9. **Insights de ChatGPT**: Solo disponibles si la organización está suscrita a plan Premium
10. **Exportación de datos**: Los miembros pueden descargar sus transacciones en CSV/PDF

---

## Entidades principales

- **User**: persona con email, contraseña hasheada, nombre, foto, estado activo
- **Organization**: empresa/grupo con nombre, descripción, logo, plan de suscripción
- **UserOrganization**: relación muchos-a-muchos entre usuarios y organizaciones con rol asignado
- **Transaction**: registro de ingreso/gasto con monto, descripción, categoría, fecha, usuario creador, organización
- **Category**: clasificación de transacciones (Salario, Comida, etc) asociada a una organización
- **AuditLog**: registro de auditoría con acción, usuario, tabla afectada, valores antiguos/nuevos, timestamp
- **RefreshToken**: tokens de refresh almacenados en BD con vencimiento

---

## Ambientes

### Desarrollo
URL base API: http://localhost:5000
URL frontend:  http://localhost:3000
BD:            postgresql://usuario:password@localhost:5432/saasfinancial_dev
ChatGPT:       key desde .env (modo test)

### Staging (futuro)
URL base API: https://staging.saasfinancial.com/api
URL frontend:  https://staging.saasfinancial.com
BD:            postgresql en servidor staging

### Producción (futuro)
URL base API: https://api.saasfinancial.com/api
URL frontend:  https://saasfinancial.com
BD:            PostgreSQL managedRDS + réplica de lectura

---

## Notas adicionales

- El proyecto está en MVP: focus en funcionalidad core, no en optimizaciones prematuras
- ChatGPT API: integración es opcional, los insights mejorados pueden ser feature futura
- Soft delete está activado para usuarios y organizaciones para preservar auditoría
- Los miembros de una organización comparten contexto lógicamente (no físicamente aislado por BD)
- Performance crítica: queries de dashboard deben optimizarse con índices y caché (Redis en futuro)
