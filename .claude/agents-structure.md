# Estructura de Agentes

## Los 7 Agentes

| Agente | Rol | Modelos (por defecto) | MCP Tools |
|--------|-----|----------------------|-----------|
| **PO** | Definir HUs, requerimientos | claude-opus-4-6 | brave-search, filesystem |
| **SCRUM** | Gestionar sprint, tasks | claude-opus-4-6 | filesystem |
| **DBA** | Diseño BD, migrations, índices | gemini-2.5-pro | filesystem, postgres, git, github |
| **BACKEND** | Endpoints, servicios, lógica | gemini-2.5-pro | filesystem, git, github, brave-search |
| **FRONTEND** | Componentes, stores, UI | gemini-2.5-pro | filesystem, git, github, brave-search |
| **TESTER** | Tests unitarios, E2E, regresión | gemini-2.5-flash | filesystem, git, github, postgres |
| **DOCS** | Documentación, diagramas | gemini-2.5-flash | filesystem, git, github |

## System Prompt de cada agente

El `buildSystemPrompt()` combina:
1. **role**: Contenido de `roles/{agente}.md`
2. **conventions**: Contenido de `conventions.md`
3. **context**: Contenido de `context.md` del proyecto
4. **repo**: Ruta específica del repo (`env.db`, `env.back`, etc)
5. **postgres**: Conexión BD (solo para DBA y TESTER)
6. **tasks**: `tasks.json` del proyecto
7. **memory**: `memory-{agente}.md` persistente del proyecto
8. **skills**: Patterns técnicos de `skills/{framework}/{pattern}.md`

## Skills (Capacidades técnicas)

### Backend (.NET)
- `dotnet/endpoint-structure.md` → Cómo estructurar controllers y endpoints
- `dotnet/unit-test-xunit.md` → Patrón xUnit + Moq
- `dotnet/json-entity-framework.md` → Mapeo EF Core
- `dotnet/soft-delete.md` → Implementación de soft delete

### Frontend (Vue3)
- `vue3/component-structure.md` → Estructura de componentes y composables
- `vue3/api-service.md` → Cliente HTTP con interceptores

### Database (PostgreSQL)
- `postgres/stored-procedure.md` → Procedimientos almacenados
- `postgres/migration.md` → Versionado de esquema

## Nombres de archivos

```
agents/
  {po|scrum|dba|backend|frontend|tester|docs}.ts  ← simples wrappers

roles/
  {po|scrum|dba|backend|frontend|tester|docs}.md  ← prompts del sistema

projects-memories/{proyecto}/
  context.md           ← descripción del proyecto (OBLIGATORIO)
  tasks.json          ← tareas actuales (generado por agentes)
  memory-po.md        ← memoria persistente del PO
  memory-scrum.md     ← memoria persistente del Scrum Master
  memory-dba.md       ← memoria persistente del DBA
  memory-backend.md   ← memoria persistente del Backend
  memory-frontend.md  ← memoria persistente del Frontend
  memory-tester.md    ← memoria persistente del Tester
  memory-docs.md      ← memoria persistente del Docs
  skills/             ← overrides de skills por proyecto
    dotnet/...
    vue3/...
    postgres/...
  contracts/          ← contratos API en JSON (POST, GET, PUT, DELETE)
```

## Flujo de ejecución

```
$ npx ts-node orchestrator/orchestrator.ts saasfinancial "Dame el estado"
   ↓
1. loadProjectEnvConfig("saasfinancial")
   → Lee SAASFINANCIAL_BACK, SAASFINANCIAL_FRONT, SAASFINANCIAL_POSTGRES, etc
   ↓
2. loadProjectContext("saasfinancial")
   → Lee context.md, tasks.json, memory-*.md
   ↓
3. buildSystemPrompt("scrum", project)
   → Combina: rol + convenciones + contexto + tareas + memoria + skills
   ↓
4. createProvider("gpt-4o")
   → Detecta prefijo (claude-*, gemini-*, gpt-*) → Elige Anthropic/Google/OpenAI
   ↓
5. API call al modelo seleccionado
   ↓
6. Retorna respuesta
```

## Reglas de interfaz

- **Entrada**: Proyecto (minúsculas) + Tarea (string)
- **Output**: Respuesta JSON o markdown del modelo
- **Persistencia**: Cada agente puede actualizar `memory-{agente}.md` y `tasks.json`
- **Estado**: Todo persiste entre llamadas en `projects-memories/{proyecto}/`
