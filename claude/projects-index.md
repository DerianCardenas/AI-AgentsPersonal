# Índice de Proyectos

Los contextos completos están en `projects-memories/{proyecto}/context.md`.

---

## SaaSFinancial (siglas: SAASF)

Sistema de finanzas personales multiusuario llamado **MiFinanza**.

- **Stack**: Vue 3 + .NET 9 + PostgreSQL + JWT + ChatGPT API
- **Context completo**: `projects-memories/saasfinancial/context.md`
- **Tareas**: `projects-memories/saasfinancial/tasks.json`
- **Memorias por rol**: `projects-memories/saasfinancial/memory-{rol}.md`
- **Repos**:
  - Backend: `C:\Users\PC\Documents\Programming\SaaSFinanciero\04-DashboardFinanzasBackendV2`
  - Frontend: `C:\Users\PC\Documents\Programming\SaaSFinanciero\04-DashboardFinanzas`

---

## Ecommerce (siglas: ECOMM)

E-commerce con catálogo, carrito, checkout y panel admin.

- **Stack**: Vue 3 + .NET 8 + PostgreSQL + Fake Store API (MVP) + ChatGPT
- **Context completo**: `projects-memories/ecommerce/context.md`
- **Tareas**: `projects-memories/ecommerce/tasks.json`
- **Memorias por rol**: `projects-memories/ecommerce/memory-{rol}.md`

---

## Convenciones globales (ambos proyectos)

- Soft delete en usuarios/entidades principales
- Auditoría en `audit_logs`
- JWT: Access Token 15 min, Refresh Token 7 días
- Nombres de proyecto: minúsculas en código, MAYÚSCULAS en variables de entorno
