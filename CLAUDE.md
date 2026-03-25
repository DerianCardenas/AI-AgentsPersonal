# CLAUDE.md — Sistema Multi-Agentes de IA

## Descripción rápida

Sistema de orquestación de 7 agentes de IA especializados (po, scrum, dba, backend, frontend, tester, docs) para gestionar 2 proyectos: **SaaSFinancial** y **Ecommerce**. Cada agente es un wrapper que llama a `runAgent()` del orquestador con contexto del proyecto.

## Proyectos

### 1. SaaSFinancial (SAASFINANCIAL_*)
- **Siglas**: SAASF
- **Descripción**: Sistema de finanzas personales multiusuario con JWT, auditoría, dashboards y ChatGPT insights
- **Stack**: Vue3 + .NET8 + PostgreSQL + JWT + ChatGPT API
- **Rutas**: `/home/derian/Documentos/DerianProyectos/05-SaaSFinancial/{Backend,Frontend,BD,Test}`

### 2. Ecommerce (ECOMMERCE_*)
- **Siglas**: ECOMM
- **Descripción**: E-commerce con catálogo, carrito, checkout, panel admin, logs y recomendaciones ChatGPT
- **Stack**: Vue3 + .NET8 + PostgreSQL + Fake Store API (MVP) + ChatGPT
- **Rutas**: `/home/derian/Documentos/DerianProyectos/06-Ecommerce/{Backend,Frontend,BD,Test}`

## Estructura de archivos

```
AgentsPersonal/
├── CLAUDE.md                          ← Este archivo
├── PROMPT_INICIAL_CLAUDE_CODE.md      ← Instrucciones iniciales (no modificar)
├── .env                               ← Variables de entorno (NO subir)
├── .gitignore                         ← Ignora .env, projects-memories/*
├── package.json                       ← Dependencias npm
├── tsconfig.json                      ← Config TypeScript
├── agents/
│   ├── po.ts                          ← Wrapper: runAgent("po", task, project)
│   ├── scrum.ts
│   ├── dba.ts
│   ├── backend.ts
│   ├── frontend.ts
│   ├── tester.ts
│   └── docs.ts
├── orchestrator/
│   ├── orchestrator.ts                ← Motor principal (loadProjectContext, buildSystemPrompt, runAgent)
│   ├── orchestrator.example.ts        ← Ejemplo (no modificar)
│   └── providers/
│       ├── base.ts                    ← createProvider (detecta prefijo claude-/gemini-/gpt-)
│       ├── anthropic.ts               ← Cliente Anthropic
│       ├── google.ts                  ← Cliente Google (Gemini)
│       └── openai.ts                  ← Cliente OpenAI
├── roles/
│   ├── po.md, scrum.md, dba.md, etc  ← Prompts del sistema para cada rol
│   └── conventions.md                 ← Reglas técnicas compartidas
├── skills/
│   ├── dotnet/                        ← Patterns: endpoint-structure, unit-test-xunit, json-entity-framework, soft-delete
│   ├── vue3/                          ← Patterns: component-structure, api-service
│   └── postgres/                      ← Patterns: stored-procedure, migration
├── mcp/
│   └── config.json                    ← Configuración MCP (si aplica)
└── projects-memories/
    ├── saasfinancial/
    │   ├── context.md                 ← Descripción del proyecto SaaSFinancial
    │   ├── tasks.json                 ← Tareas actuales (generado por agentes)
    │   ├── memory-dba.md, etc         ← Memoria persistente por agente
    │   └── contracts/                 ← Contratos API (JSON)
    ├── ecommerce/
    │   ├── context.md                 ← Descripción del proyecto Ecommerce
    │   ├── tasks.json
    │   ├── memory-*.md
    │   └── contracts/
    ├── example-project/               ← Ejemplo (no modificar)
    └── context_example.md             ← Plantilla (no modificar)
```

## Cómo usar

### Ejecutar un agente
```bash
npx ts-node orchestrator/orchestrator.ts <proyecto> "<tarea>"
```

Ejemplos:
```bash
npx ts-node orchestrator/orchestrator.ts saasfinancial "Dame el estado actual del proyecto"
npx ts-node orchestrator/orchestrator.ts ecommerce "Configura la BD y crea los esquemas"
```

### Cambiar modelos (en .env)

#### Opción A: APIs externas (requiere créditos)
```env
MODEL_PO=claude-opus-4-6             # Anthropic
MODEL_SCRUM=gemini-2.5-pro           # Google
MODEL_DBA=gpt-4o                     # OpenAI
```

#### Opción B: Ollama Local (GRATIS, sin créditos) ⭐
```env
MODEL_PO=ollama:mistral              # Mistral 7B local
MODEL_SCRUM=ollama:mistral
MODEL_DBA=ollama:mistral
MODEL_BACKEND=ollama:mistral
MODEL_FRONTEND=ollama:mistral
MODEL_TESTER=ollama:mistral
MODEL_DOCS=ollama:mistral
```

#### Opción C: Ollama Remoto (equipo gaming como servidor)
```env
MODEL_PO=http://192.168.1.100:11434  # IP de tu gaming
MODEL_SCRUM=http://192.168.1.100:11434
# ... todos los modelos
```

**Prefijos soportados**: `claude-*` (Anthropic), `gemini-*` (Google), `gpt-*` (OpenAI), `ollama:*` (Local), `http://` / `https://` (Remoto)

## Estado actual de APIs

- ✗ **Anthropic**: Sin créditos
- ✗ **OpenAI**: Cuota excedida
- ⚠️ **Gemini**: Free tier agotado (pero es la opción más viable)

**Próxima acción**: Agregar créditos a cualquiera de las APIs para iniciar desarrollo.

## Convenciones importantes

1. **Nombres de proyectos**: minúsculas en código (`saasfinancial`, `ecommerce`), MAYÚSCULAS en .env (`SAASFINANCIAL_*`, `ECOMMERCE_*`)
2. **context.md**: Cada proyecto DEBE tener uno detallado (stack, repos, convenciones, reglas de negocio)
3. **tasks.json**: Generado por agentes, formato JSON estructurado
4. **Soft delete**: Habilitado en ambos proyectos para usuarios/organizaciones/productos
5. **Auditoría**: TODOS los cambios se registran en `audit_logs`
6. **JWT**: Access Token 15 min, Refresh Token 7 días

## Próximos pasos

1. ✅ Setup completado (agentes, contextos, compilación)
2. ⏳ Esperar créditos en APIs
3. → Ejecutar: `npx ts-node orchestrator/orchestrator.ts saasfinancial "Iniciamos el proyecto. PO define primeras HUs"`
4. → Configurar BD (agente DBA)
5. → Generar primeras historias de usuario
6. → Crear esquema de BD
7. → Iniciar desarrollo backend/frontend

## Notas técnicas

- **Orquestador**: Lee `context.md` + `tasks.json` + `memory-*.md` por agente, construye system prompt completo
- **MCP Tools**: Filesystem, Git, GitHub, PostgreSQL, Brave Search (según agente)
- **Repositorios**: NO están clonados aún, el DBA los creará según BD necesarias
