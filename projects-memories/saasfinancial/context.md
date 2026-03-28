# Proyecto: SaaSFinancial — Sistema de Finanzas Personales Multiusuario

## Descripción general

Aplicación de finanzas personales llamada **MiFinanza**. Owner: Derian.
Permite registrar ingresos, gastos y transferencias entre cuentas, categorizarlos y visualizarlos mediante dashboards con gráficos interactivos y filtros avanzados. Incluye autenticación JWT, auditoría y está orientado a evolucionar hacia multiusuario con organizaciones. Integración opcional con ChatGPT para insights de gasto.

El proyecto tiene un MVP funcional: frontend Vue 3 + backend .NET 9 conectados, con CRUD de transacciones, cuentas, categorías, suscripciones y dashboard con gráficos.

## Siglas del proyecto

SIGLAS: SAASF

## Usuarios del sistema

- **Usuario autenticado**: acceso completo a sus propios datos (transacciones, cuentas, categorías, dashboard)
- *(Futuro)* Roles: Owner > Admin > Member > Viewer en contexto de organizaciones

---

## Stack tecnológico

### Frontend
Vue 3.4 + TypeScript 5.3 (Strict Mode) + Vite 5.0 + **PrimeVue 4.0** + Tailwind CSS 3.4 + Pinia 2.1 + Vue Router 4.2 + Axios 1.6 + Chart.js 4.4 + vue-chartjs 5.3

### Backend
**.NET 9** / C# + ASP.NET Core + **CQRS con MediatR** + EF Core + Npgsql + AutoMapper + JWT Bearer + Swagger/OpenAPI

Patrón de llamada: `Controller → Execute(Command/Query) → MediatR → Handler → Service (Infrastructure) → EF Core → AutoMapper → BaseResponse`

Respuesta estándar del API:
```json
{ "data": {}, "message": "Se ha realizado la petición con exito" }
```

**NUNCA poner lógica de negocio en Controllers.** Los controllers solo despachan al mediator.

### Base de datos
**PostgreSQL local** en `localhost:5432`
- BD: `mifinanza` | Usuario: `mifinanza` | Password: `mifinanza_local_db`
- Tablas creadas vía EF Core migration `InitialCreate`: `profiles`, `accounts`, `categories`, `transactions`, `subscriptions`
- Supabase se mantiene como referencia/producción remota

### Testing
- Unitarias Backend: xUnit + Moq
- Unitarias Frontend: Vitest + Vue Test Utils
- Integración: Vitest + MSW (Mock Service Worker)
- E2E: Playwright

### Otros
- Autenticación: JWT (Access Token 15 min + Refresh Token 7 días)
- Storage tokens: localStorage (`access_token`, `refresh_token`)
- IA: ChatGPT API para insights (feature Premium futura)
- `dotnet-ef` instalado globalmente (`~/.dotnet/tools/dotnet-ef`)

---

## Repositorios

back-repo:  C:\Users\PC\Documents\Programming\SaaSFinanciero\04-DashboardFinanzasBackendV2
front-repo: C:\Users\PC\Documents\Programming\SaaSFinanciero\04-DashboardFinanzas

Repo remoto backend: `git@github.com:DerianCardenas/04-DashboardFinanzasBackendV2.git`

---

## Ramas Frontend

| Rama | Estado |
|---|---|
| `master` | Base estable, integración API completa, tema dark slate fijo |
| `feat-redesign` | **Rama activa de desarrollo** — Rediseño enterprise: sidebar, toggle dark/claro, indigo primary |

### Rediseño UI (rama `feat-redesign`)
- Sistema de diseño: dark-navy como base, indigo (#6366f1) como accent, tokens CSS en variables RGB
- Layout: sidebar fijo colapsable (desktop) / overlay (móvil), topbar con toggle y logout
- Tema: dark por defecto, toggle claro/oscuro (`darkModeSelector: '.dark'` en PrimeVue config, aplica clase `.dark` en `<html>`)
- Sin glassmorphism — cards sólidas con bordes sutiles
- Componentes rediseñados: `style.css`, `App.vue`, `ThemeToggle.vue`, `LoginViewModern.vue`, `ReportesView.vue`
- `useSessionMonitor.ts` usa `useNotifications` (NO PrimeVue `useToast`). `App.vue` no tiene `<Toast>` de sesión.

---

## Estructura de carpetas

### back-repo/ (04-DashboardFinanzasBackendV2)
```
DashboardFinanciero.sln
├── Library/          → Base reutilizable: AppException, BaseResponse, middleware, ScopedRegistrationAttribute
├── Infrastructure/   → EF Core DbContext, entidades, migraciones, repos, servicios de datos
├── Domain/           → CQRS: Commands, Queries, Handlers, AutoMapper profiles, TransformHandler base
└── Application/      → Controllers, DI wiring, Program.cs, appsettings, BaseController
```
Referencias: `Application → Domain → Infrastructure → Library`

Archivos clave del patrón (referencia: semov_backend):
- `Domain/Source/TransformHandler.cs` — Base de todos los handlers
- `Library/Source/V1/Application/AppException.cs` — Modelo de excepciones
- `Library/Source/V1/Domain/Response/BaseResponse.cs` — Respuesta estándar
- `Application/Source/Configuration/BaseController.cs` — Base de controllers
- `Library/Source/Helper/Attribute/ScopedRegistrationAttribute.cs` — Auto-registro DI

### front-repo/ (04-DashboardFinanzas)
```
src/
├── components/
│   ├── charts/              → BarChartComponent, LineChartComponent, DoughnutChartComponent
│   ├── TransactionForm.vue
│   ├── TransactionTable.vue / TransactionList.vue
│   ├── TransactionFilters.vue
│   └── TransactionActions.vue
├── views/
│   ├── DashboardViewNew.vue   → Dashboard principal (USAR ESTE — DashboardView.vue es legacy)
│   ├── TransactionsView.vue
│   ├── GastosView.vue / IngresosView.vue / CuentasView.vue / ResumenView.vue
│   ├── ReportesView.vue       → rediseñada en feat-redesign
│   ├── LoginViewModern.vue / RegisterViewModern.vue
│   └── ThemeToggle.vue        → toggle dark/claro (feat-redesign)
├── stores/
│   └── auth.ts               → Pinia, tokens en localStorage
├── composables/
│   ├── useNotifications.ts   → Toast notifications
│   └── useSessionMonitor.ts  → Monitor de sesión (usa useNotifications, no useToast)
├── infrastructure/api/
│   ├── apiClient.ts          → Axios + interceptores JWT + refresh automático en 401
│   └── services/
│       ├── dashboardService.ts / transactionService.ts
│       ├── accountService.ts / categoryService.ts / healthService.ts
├── types/
│   ├── dashboard.ts / transaction.ts
└── router/index.ts           → guards requiresAuth / requiresGuest
```

---

## Endpoints del API

Base: `http://localhost:5000/api/v1/`

| Módulo | Endpoints |
|---|---|
| Auth | `POST auth/register`, `POST auth/login`, `GET auth/logout`, `GET auth/me`, `PUT auth/profile` |
| Cuentas | `GET/POST account/all`, `GET/PUT/DELETE account/{id}`, `GET account/summary` |
| Transacciones | `GET/POST transaction/all`, `GET/PUT/DELETE transaction/{id}`, `GET transaction/installments/summary` |
| Categorías | `GET category/all`, `POST category/create`, `PUT/DELETE category/{id}` |
| Dashboard | `GET dashboard/summary`, `GET dashboard/monthly-stats`, `GET dashboard/debt-summary`, `GET dashboard/expenses-by-category` |
| Suscripciones | `GET/POST subscription/all`, `PUT/DELETE subscription/{id}`, `GET subscription/summary` |
| Reportes | `POST report/generate` |

---

## Convenciones de código

### .NET Backend
- Usar `record` para Commands y Queries
- Handlers heredan de `TransformHandler<T, TRequest, TResponse>` o implementan `IRequestHandler` directamente
- Servicios llevan `[ScopedRegistration]` para auto-registro DI
- Entidades llevan `[Table("nombre_tabla")]` y `[Column("nombre_columna")]` explícitos
- Rutas en minúsculas: `/api/v1/{dominio}/{accion}`
- Respuesta siempre `BaseResponse` (con `data` y `message`)
- Excepciones de negocio: clases de `AppException`
- `IHttpContext`: solo `GetToken()` y `GetUserId()`. `HttpContextContext` extrae UUID del JWT.

### Frontend Vue
- Composition API con `<script setup>` en todos los componentes
- Servicios en `infrastructure/api/services/` — uno por dominio
- Stores Pinia en `stores/`
- Composables en `composables/`
- Orden en `<script setup>`: Imports → Types → Props & Emits → Composables → State → Computed → Methods → Lifecycle

### Nomenclatura — Base de datos
- snake_case para tablas y columnas
- Prefijo `idx_` para índices, `uc_` para unique constraints, `fk_` para foreign keys

---

## Reglas de negocio importantes

1. **Tipos de transacción**: Income, Expense, Transfer. Transfers no requieren categoría.
2. **Categorías por tipo**: Se filtran según tipo de transacción (income/expense).
3. **Seguridad auth**: Frontend hashea password con **SHA-256** antes de enviar. Backend recibe el hash SHA-256 y lo re-hashea con **BCrypt** antes de guardar. En login: `BCrypt.Verify(sha256Hash, storedBcryptHash)`.
4. **Soft delete selectivo**: `AccountEntity` y `TransactionEntity` tienen `DeletedAt` con `HasQueryFilter` en EF Core. `CategoryEntity` usa hard delete.
5. **MSI/MCI**: No genera transacciones automáticas. Calcula cuotas restantes por fecha de compra. El pago mensual de tarjeta se registra manualmente.
6. **No lógica en controllers**: Solo despachan al mediator. Lógica va en Handler → Service (Infrastructure).
7. **Tema en `feat-redesign`**: `darkModeSelector: '.dark'` — PrimeVue lee la clase `.dark` en `<html>`, la aplica `useTheme.ts`.
8. **PrimeVue dark mode overrides**: Usar `:deep()` CSS para sobreescribir estilos de componentes PrimeVue.
9. **Fechas**: Locale español en PrimeVue config (`main.ts`). Formato `dd/mm/yy` en todos los Calendar.
10. **Chart.js font.weight**: Debe ser número (`weight: 500`), no string.
11. **Array.isArray()** antes de `.join()` en filtros de cuentas (evita TypeError cuando se limpia el filtro).
12. **`DashboardView.vue` es legacy** — usar siempre `DashboardViewNew.vue`.

---

## Entidades principales

- **Profile/User**: persona con email, password (BCrypt de SHA-256), nombre, estado activo
- **Account**: cuenta financiera (banco, efectivo, tarjeta) con saldo y `DeletedAt`
- **Transaction**: registro de ingreso/gasto/transferencia, con `DeletedAt`
- **Category**: clasificación de transacciones por tipo (hard delete)
- **Subscription**: suscripciones recurrentes del usuario
- *(Futuro)* **Organization**: empresa/grupo con miembros y roles
- *(Futuro)* **AuditLog**: auditoría de acciones

---

## Ambientes

### Desarrollo
URL base API: http://localhost:5000
URL frontend:  http://localhost:5173 (Vite)
BD:            `Host=localhost;Port=5432;Database=mifinanza;Username=mifinanza;Password=mifinanza_local_db`

### Producción (remoto)
URL backend: https://04-dashboard-finanzas-backend.vercel.app
BD: Supabase PostgreSQL (puerto 6543, SSL requerido)

---

## Comandos para ejecutar

### Backend
```bash
cd "C:\Users\PC\Documents\Programming\SaaSFinanciero\04-DashboardFinanzasBackendV2\Application"
dotnet run   # → http://localhost:5000, Swagger en http://localhost:5000/swagger
```

### Frontend
```bash
cd "C:\Users\PC\Documents\Programming\SaaSFinanciero\04-DashboardFinanzas"
npm run dev   # → http://localhost:5173
```

### Migraciones EF Core
```bash
cd Infrastructure
~/.dotnet/tools/dotnet-ef migrations add NombreMigracion --startup-project ../Application
~/.dotnet/tools/dotnet-ef database update --startup-project ../Application
```

---

## Pendientes

- [ ] Migrar datos desde Supabase a BD local (o crear seed data)
- [ ] Continuar rediseño de otras vistas en `feat-redesign` (Gastos, Ingresos, Cuentas, Dashboard)
- [ ] Merge de `feat-redesign` → `master` cuando el cliente apruebe el diseño
- [ ] Verificar integración completa frontend ↔ backend .NET 9 local

---

## Notas adicionales

- Backend de referencia de arquitectura: `semov_backend` (en equipo anterior — Linux). Consultar para replicar patrón exacto de handlers, services y DI.
- Backend Laravel en `04-DashboardFinanzasBackend/` — **solo de referencia para lógica de negocio, NO MODIFICAR**.
- No hay `04-DashboardFinanzasBackend/` en este equipo Windows — solo el V2 .NET 9.
- `appsettings.Development.json` en Application/ — nunca commitear (contiene connection string y JWT key).
