# SaaSFinancial — EFinance

## Identificación
- **Nombre**: EFinance
- **Iniciales de proyecto**: SAASF
- **Owner**: Derian
- **Tipo**: Aplicación de finanzas personales

## Repos
- **Frontend**: `github.com/DerianCardenas/04-DashboardFinanzas`
  - Ruta local: `/home/seki/Documentos/Proyectos/04-DashboardFinanzas`
- **Backend**: `github.com/DerianCardenas/04-DashboardFinanzasBackendV2`
  - Ruta local: `/home/seki/Documentos/Proyectos/DashboardFinancieroBackendV2`

## Stack

### Frontend
- Vue 3.5 + TypeScript 5.8 (Composition API, `<script setup>`)
- Vite 5.4 | PrimeVue 4.3 (preset Aura) | Tailwind CSS 4.1
- Pinia 3.0 | Axios 1.11 | Vue Router 4.5
- Chart.js 4.5 + vue-chartjs | vee-validate + Yup | date-fns 4.1

### Backend
- .NET 9 | ASP.NET Core | EF Core + Npgsql | MediatR 12 (CQRS)
- AutoMapper 14 | JWT Bearer | Swagger/OpenAPI
- Patrón CQRS basado en semov_backend
- Ruta semov_backend: `/home/seki/Documentos/Proyectos/semov_backend`

### Infraestructura
- BD local: PostgreSQL en `localhost:5432` (db: `mifinanza`, user: `mifinanza`, pass: `mifinanza_local_db`)
- BD producción: Supabase (PostgreSQL)
- Storage: Local en dev / Supabase Storage en prod (capa intercambiable via `IStorageService`)
- Correos: Resend API (no Gmail API)
- Deploy: Netlify (frontend) + Railway (backend)

## Convenciones de ramas y commits
- Ramas: `feat-HU{número}` | `fix-HU{número}-{descripcion}`
- Base para ramas: siempre desde `dev`
- PRs siempre a `dev`, nunca a `master`
- Commits: `SAASF{número} | {Descripción corta en español}`
- Ejemplo: `SAASF01 | Migración inicial de base de datos creada`

## Entidades principales
`profiles` · `accounts` · `categories` · `transactions` · `transfers` · `password_reset_tokens`

Fase 2: `households` · `household_members` · `subscriptions`

## Reglas de negocio críticas

### Soft delete
Todas las entidades usan soft delete (`deleted_at`) excepto:
- `transfers`: no se eliminan, solo se editan. Para anular: editar monto a $0
- `categories`: hard delete, verificar que no tenga transacciones activas antes de eliminar

### Saldos
- Gasto: `account.balance -= amount`
- Ingreso: `account.balance += amount`
- Transferencia normal: `from.balance -= amount` | `to.balance += amount`
- Abono a crédito (`is_credit_payment=true`): igual que transferencia normal (reduce deuda)

### Seguridad
- Frontend: hashear password con SHA-256 antes de enviar
- Backend: re-hashear con BCrypt antes de guardar
- JWT: expiración 15-30 min + refresh token
- Rate limiting en todos los endpoints de auth
- Links de recuperación: un solo uso, expiran en 15 minutos
- HTTPS forzoso en producción

### MSI/MCI
- MSI: `cuota = monto / meses`, sin interés
- MCI: amortización francesa con tasa anual ingresada por el usuario
- Al registrar compra a meses: saldo se descuenta inmediatamente de la tarjeta

### Categorías base (se crean al registrar un usuario)
- income: Salario, Freelance, Inversión, Préstamo, Otros
- expense: Alimentación, Renta, Hipoteca, Electricidad, Internet

### Onboarding
- Wizard al primer login (`onboarding_completed = false`)
- Saltable — aviso persistente si se salta
- Sin al menos una cuenta: formularios de gasto/ingreso bloqueados

## Patrón CQRS (semov_backend)
```
Controller → BaseController.Execute(Command/Query)
  → IMediator.Send()
    → Handler.Handle()
      → Service.Execute() [en Infrastructure]
        → EF Core
      → return BaseResponse(data)
```

### Naming
| Artefacto | Patrón |
|---|---|
| Command | `{Accion}{Entidad}Command` |
| Query | `{Accion}{Entidad}Query` |
| Handler | `{Command/Query}Handler` |
| Service | `{Accion}{Entidad}Service` |
| Entity | `{Entidad}Entity` |
| DTO | `{Entidad}Model` |

### Respuesta estándar
```json
{ "data": { ... }, "message": "Se ha realizado la petición con éxito" }
```

## Sistema de diseño (frontend)
- Base: dark-navy | Accent: indigo `#6366f1`
- Tokens CSS como variables RGB
- Tema dark por defecto, toggle claro/oscuro
- Layout: sidebar fijo colapsable (desktop) / overlay (móvil)
- Cards sólidas con bordes sutiles — sin glassmorphism
- PrimeVue: `darkModeSelector: '.dark'`

## Ejecutar localmente
```bash
# Backend
cd DashboardFinancieroBackendV2/Application && dotnet run  # → localhost:5000

# Frontend
cd 04-DashboardFinanzas && npm run dev  # → localhost:5173

# Migraciones
cd DashboardFinancieroBackendV2/Infrastructure
~/.dotnet/tools/dotnet-ef migrations add {Nombre} --startup-project ../Application
~/.dotnet/tools/dotnet-ef database update --startup-project ../Application
```
