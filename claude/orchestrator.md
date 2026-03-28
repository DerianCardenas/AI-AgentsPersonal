# Guía de Orquestación — Claude Code como Orchestrator

## Arquitectura

```
Usuario
 │
 ▼
Claude Code (Orchestrator principal)
 │  Lee: context.md + tasks.json + memory-{rol}.md del proyecto
 │
 ├──► Subagente PO        → roles/po.md
 ├──► Subagente Scrum     → roles/scrum.md
 ├──► Subagente DBA       → roles/dba.md
 ├──► Subagente Backend   → roles/backend.md
 ├──► Subagente Frontend  → roles/frontend.md
 ├──► Subagente Tester    → roles/tester.md
 └──► Subagente Docs      → roles/docs.md
```

No se usan API keys externas. Los subagentes corren via el `Agent` tool nativo de Claude Code, bajo la suscripción del usuario.

---

## Cómo invocar un subagente

Antes de invocar cualquier subagente, el orchestrator (yo) SIEMPRE:

1. Lee `projects-memories/{proyecto}/context.md`
2. Lee `projects-memories/{proyecto}/tasks.json` (si existe)
3. Lee `projects-memories/{proyecto}/memory-{rol}.md` (si existe)
4. Lee `roles/{rol}.md` para el system prompt del rol
5. Invoca el subagente con todo ese contexto + la tarea específica

### Estructura del prompt al subagente

```
[ROL SYSTEM PROMPT — contenido de roles/{rol}.md]

[CONTEXTO DEL PROYECTO — contenido de context.md]

[ESTADO DE TAREAS — contenido de tasks.json si aplica]

[MEMORIA DEL ROL — contenido de memory-{rol}.md si existe]

[TAREA — lo que el usuario pidió para este rol]
```

### Skills disponibles para subagentes

Los subagentes pueden usar herramientas de lectura/escritura de archivos y bash para:
- Leer código existente en los repos del proyecto
- Escribir/modificar archivos de código
- Leer/actualizar tasks.json y memory files
- Ejecutar comandos (dotnet, npm, git, etc.)

---

## Gestión de memoria

Después de que un subagente completa su trabajo:

1. **Actualizar `tasks.json`**: cambiar status de tareas completadas
2. **Actualizar `memory-{rol}.md`**: guardar decisiones, contexto importante, estado
3. **Si hay cambios de arquitectura**: actualizar `context.md` del proyecto

### Formato de memory-{rol}.md

```markdown
# Memoria: {Rol} — {Proyecto}

## Última sesión: {fecha}

## Decisiones tomadas
- [decisión]: [razón]

## Estado actual
[qué se hizo, qué falta]

## Notas importantes
[contexto que el rol necesita recordar en próximas sesiones]
```

---

## Flujo de trabajo tipo

```
1. Usuario pide acción sobre un proyecto
2. Orchestrator identifica qué rol(es) necesita
3. Lee context + tasks + memory del rol
4. Invoca subagente con contexto completo
5. Subagente ejecuta, produce output
6. Orchestrator guarda resultado en memory-{rol}.md y actualiza tasks.json
7. Orchestrator reporta al usuario y pregunta siguiente paso
```

---

## Cuándo invocar cada rol

| Tarea | Rol(es) |
|---|---|
| Definir qué construir, HUs, backlog | PO |
| Planificar sprint, asignar tareas | Scrum |
| Schema BD, migraciones, queries | DBA |
| Endpoints, CQRS handlers, servicios | Backend |
| Componentes Vue, stores, servicios API | Frontend |
| Unit tests, integration tests, E2E | Tester |
| README, contratos API, documentación | Docs |

---

## Reglas del orchestrator

1. **Nunca asumir** — si el contexto está incompleto, leer los archivos antes de actuar
2. **Un rol a la vez** — no mezclar responsabilidades en un solo subagente
3. **Persistir siempre** — toda sesión termina actualizando memory files
4. **Respetar dependencias** — no invocar Backend antes que DBA si hay dependencia en tasks.json
5. **Preguntar si hay ambigüedad** — mejor confirmar que hacer lo incorrecto
