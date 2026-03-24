# skills/

Guías técnicas que enseñan a cada agente **cómo** hacer bien una tarea específica.

---

## ¿Qué es un skill?

Un skill no dice qué hacer — dice **cómo hacerlo correctamente**.

```
rol/backend.md          → quién eres y cómo trabajas
prompts/crear-endpoint  → qué hacer cuando creas un endpoint
skills/dotnet/endpoint  → cómo debe verse un endpoint bien hecho ← aquí
```

El agente lee su skill **antes de ejecutar una tarea** — garantiza calidad y consistencia.

---

## Estructura

```
skills/
├── dotnet/                         → .NET 8 / C#
│   ├── endpoint-structure.md       → Controller + Service + DTOs
│   ├── unit-test-xunit.md          → Pruebas unitarias con xUnit + Moq
│   ├── json-entity-framework.md    → Columnas JSONB con EF Core
│   └── soft-delete.md              → Patrón de eliminación lógica
│
├── vue3/                           → Vue 3 / TypeScript / Tailwind
│   ├── component-structure.md      → Componente con estados (carga/error/vacío)
│   └── api-service.md              → Service + Store Pinia + Composable
│
└── postgres/                       → PostgreSQL
    ├── stored-procedure.md         → Estructura y convenciones de SPs
    └── migration.md                → Migraciones versionadas y reversibles
```

---

## Qué skill lee cada agente

| Agente | Skills que debe leer |
|---|---|
| DBA | `postgres/stored-procedure.md`, `postgres/migration.md` |
| Backend | `dotnet/endpoint-structure.md`, `dotnet/unit-test-xunit.md`, `dotnet/json-entity-framework.md`, `dotnet/soft-delete.md` |
| Frontend | `vue3/component-structure.md`, `vue3/api-service.md` |
| Tester | Lee las skills de Back y Front para saber qué verificar |

---

## Skills por stack vs skills por proyecto

Las skills de esta carpeta son **base reutilizable por stack**.
Si un proyecto necesita algo diferente o adicional, puede sobreescribirlas:

```
projects-memories/{proyecto}/skills/
└── endpoint-structure.md   → override específico del proyecto
```

El orquestador carga primero las skills base del stack,
y si el proyecto tiene las suyas, las sobreescribe.

---

## Cómo añadir una skill nueva

1. Identifica el stack al que pertenece
2. Crea el archivo en la carpeta correcta
3. Sigue este formato:

```markdown
# Skill: {Nombre descriptivo}
# Stack: {tecnología}
# Agente: {agente que la usa}
# Leer antes de: {cuándo aplica}

---

## Estructura / Patrón

{código de referencia}

## Reglas importantes

{lista de reglas}

## Checklist antes de marcar como terminado

- [ ] criterio 1
- [ ] criterio 2
```

**Regla:** una skill entra aquí solo cuando se usó en un proyecto real y funcionó bien.
