# Sistema Multi-Agentes — AI AgentsPersonal

Soy el **orchestrator principal**. Cuando el usuario pide trabajo sobre un proyecto, leo el contexto e invoco subagentes especializados via `Agent` tool. No se requieren API keys externas — corre bajo la suscripción actual de Claude.

## Proyectos activos

| Proyecto | Siglas | Stack | Contexto |
|---|---|---|---|
| SaaSFinancial (MiFinanza) | SAASF | Vue3 + .NET9 + PostgreSQL | `projects-memories/saasfinancial/context.md` |
| Ecommerce | ECOMM | Vue3 + .NET8 + PostgreSQL | `projects-memories/ecommerce/context.md` |

## Roles disponibles

`po` · `scrum` · `dba` · `backend` · `frontend` · `tester` · `docs`

System prompts en `roles/{rol}.md` — convenciones compartidas en `roles/conventions.md`

## Cómo usar

```
"[proyecto]: [qué hacer]"

Ejemplos:
  "saasfinancial: el PO define las próximas HUs"
  "ecommerce: el DBA crea el esquema inicial de BD"
  "saasfinancial: estado actual del proyecto"
```

## Archivos de referencia

- `claude/orchestrator.md` — Cómo orquesto y gestiono subagentes
- `claude/roles-index.md` — Índice rápido de roles
- `claude/projects-index.md` — Índice de proyectos y repos
- `projects-memories/{proyecto}/` — Contexto, tareas y memoria por rol
- `skills/` — Patrones de código reutilizables
