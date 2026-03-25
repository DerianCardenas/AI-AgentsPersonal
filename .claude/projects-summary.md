# Proyectos — Resumen ejecutivo

## 1. SaaSFinancial (SAASF)

**Objetivo**: Sistema web de gestión de finanzas personales con modelo multiusuario.

**Variables .env**:
```
SAASFINANCIAL_BACK=/home/derian/Documentos/DerianProyectos/05-SaaSFinancial/Backend
SAASFINANCIAL_FRONT=/home/derian/Documentos/DerianProyectos/05-SaaSFinancial/Frontend
SAASFINANCIAL_DB=/home/derian/Documentos/DerianProyectos/05-SaaSFinancial/BD
SAASFINANCIAL_TEST=/home/derian/Documentos/DerianProyectos/05-SaaSFinancial/Test
SAASFINANCIAL_POSTGRES=postgresql://usuario:password@localhost:5432/saasfinancial_dev
```

**Stack**:
- Frontend: Vue3 + TypeScript + Quasar + Pinia + Chart.js
- Backend: .NET8 + EF Core + Clean Architecture + JWT
- DB: PostgreSQL 15+
- Testing: xUnit (backend), Vitest (frontend), Playwright (E2E)
- IA: ChatGPT API (insights automáticos)

**Entidades principales**:
- User, Organization, UserOrganization (N:N con Role)
- Transaction, Category
- AuditLog (middleware)
- RefreshToken

**Reglas críticas**:
- Aislamiento por organización (user solo ve sus orgs)
- Roles: Owner > Admin > Member > Viewer
- Soft delete para users y orgs
- JWT: AT=15min, RT=7días
- Auditoría de TODOS los cambios
- ChatGPT solo si plan Premium

**Ambientes**:
- Dev: localhost:3000 (frontend) | localhost:5000 (backend)
- BD Dev: postgresql://localhost:5432/saasfinancial_dev

**Siglas para commits**: `SAASF`

---

## 2. Ecommerce (ECOMM)

**Objetivo**: Plataforma e-commerce con catálogo, carrito, checkout y panel administrativo.

**Variables .env**:
```
ECOMMERCE_BACK=/home/derian/Documentos/DerianProyectos/06-Ecommerce/Backend
ECOMMERCE_FRONT=/home/derian/Documentos/DerianProyectos/06-Ecommerce/Frontend
ECOMMERCE_DB=/home/derian/Documentos/DerianProyectos/06-Ecommerce/BD
ECOMMERCE_TEST=/home/derian/Documentos/DerianProyectos/06-Ecommerce/Test
ECOMMERCE_POSTGRES=postgresql://usuario:password@localhost:5432/ecommerce_dev
```

**Stack**:
- Frontend: Vue3 + TypeScript + Vuetify + Pinia + Axios
- Backend: .NET8 + EF Core + Clean Architecture + JWT
- DB: PostgreSQL 15+
- Testing: xUnit (backend), Vitest (frontend), Playwright (E2E)
- APIs: Fake Store API (MVP → evolucionará a BD propia)
- IA: ChatGPT API (recomendaciones, análisis)

**Entidades principales**:
- User (roles: Customer, Admin, SuperAdmin)
- Product, Category, ProductImage
- Order, OrderItem, OrderStatus (pending → paid → shipped → delivered)
- AuditLog (middleware)
- Cart (persistente en BD para autenticados)

**Reglas críticas**:
- Catálogo público (sin auth)
- Carrito persistente (BD) vs temporal (localStorage para guests)
- Estados orden inmutables (salvo cancelación)
- Stock real: no vender > disponible
- Inventario decrementa cuando orden → "paid"
- Alertas si stock < 10
- Precios inmutables en órdenes ya creadas
- Soft delete para productos (archived)
- Logs de TODOS los cambios administrativos

**Ambientes**:
- Dev: localhost:3000 (frontend) | localhost:5000 (backend)
- Fake Store API: https://fakestoreapi.com (MVP)
- BD Dev: postgresql://localhost:5432/ecommerce_dev

**Siglas para commits**: `ECOMM`

---

## Context.md — Qué contiene

Cada proyecto tiene `projects-memories/{proyecto}/context.md` con:
1. Descripción general del sistema
2. Siglas (para commits)
3. Usuarios y roles
4. Stack completo (FE, BE, DB, Testing, APIs externas)
5. Repositorios (rutas absolutas)
6. Estructura de carpetas (back, front, db, test)
7. Convenciones de código (nomenclatura BD, backend, frontend)
8. Reglas de negocio críticas
9. Entidades principales
10. Ambientes (dev, staging, prod)
11. Notas adicionales

**NO subir al repo** (están en .gitignore):
- `.env` (variables secretas)
- `context.md` (específico de desarrollador)
- `tasks.json` (estado dinámico)
- `memory-*.md` (persistencia temporal)
- `contracts/*.json` (detalles de API)

---

## Comparación lado a lado

| Aspecto | SaaSFinancial | Ecommerce |
|---------|---|---|
| **Tipo** | SaaS multiusuario | Plataforma pública |
| **Auth** | JWT obligatorio | JWT + guests |
| **Datos** | Privados por org | Públicos + privados (órdenes) |
| **Auditoría** | Acciones usuarios | Acciones admin |
| **IA** | Insights de gasto | Recomendaciones productos |
| **Complejidad** | Media (multiusuario) | Media (catálogo + admin) |
| **MVP** | Con BD propia | Fake Store API |

---

## Base de datos

Ambos proyectos usan **PostgreSQL 15+** local. El **agente DBA** es responsable de:
1. Crear la BD (si no existe)
2. Ejecutar migrations
3. Crear índices
4. Seedear datos iniciales
5. Optimizar queries críticas

Archivos de BD están en `{proyecto}_DB` (variables .env):
- `migrations/` → scripts SQL versionados
- `seeds/` → datos iniciales
- `docs/` → diagramas ER, queries, notes

Comandos típicos del DBA:
```bash
npx ts-node orchestrator/orchestrator.ts saasfinancial \
  "Configura la BD: crea tablas, índices y seedea datos iniciales"
```
