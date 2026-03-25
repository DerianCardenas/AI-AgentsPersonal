# Estado del Setup — 24 Mar 2026

## ✅ Completado

- [x] npm install sin errores
- [x] npx tsc --noEmit sin errores
- [x] 7 agentes creados (po.ts, scrum.ts, dba.ts, backend.ts, frontend.ts, tester.ts, docs.ts)
- [x] 2 contextos de proyectos completados
  - [x] SaaSFinancial: descripción, stack, entidades, reglas
  - [x] Ecommerce: descripción, stack, entidades, reglas
- [x] .env configurado con:
  - [x] AGENTS_ROOT → raíz del proyecto (no /agents)
  - [x] SAASFINANCIAL_* y ECOMMERCE_* en MAYÚSCULAS COMPLETAS
  - [x] Rutas de repos validadas
  - [x] Modelos por agente (gemini-2.5-pro por defecto)
- [x] Estructura de carpetas verificada
  - [x] agents/
  - [x] projects-memories/saasfinancial/
  - [x] projects-memories/ecommerce/
  - [x] orchestrator/
  - [x] roles/, skills/, mcp/
- [x] CLAUDE.md creado (memoria del sistema, <600 líneas)
- [x] .claude/ con archivos de soporte

## ⚠️ APIs externas sin disponibilidad

**Estado actual** (24 Mar 10:50 UTC):
- ❌ Anthropic: Sin créditos (`Your credit balance is too low`)
- ❌ OpenAI: Cuota excedida (429)
- ⚠️ Gemini: Free tier agotado (429)

**✅ SOLUCIÓN: Ollama Local (NUEVO)**
- ⭐ Gratis, sin créditos
- ⭐ Privado, todo local
- ⭐ RTX 5060 (8GB) perfecta para Mistral 7B
- Último intento fallido:
```
$ npx ts-node orchestrator/orchestrator.ts saasfinancial "Dame el estado actual"
→ gemini-2.5-pro
→ Error 429: Quota exceeded for metric: generate_content_free_tier
```

## 🎯 Próximos pasos

### Fase 1: Resolver APIs (Bloqueante)
1. **Opción A (Recomendada)**: Agregar créditos a Anthropic
   - URL: https://console.anthropic.com/account/billing/overview
   - Crear nuevo payment method y agregar $20+

2. **Opción B**: Esperar a que Gemini free tier se resetee (diario)
   - Esperar ~24h o crear nueva API key
   - Probar mañana con: `npx ts-node orchestrator/orchestrator.ts saasfinancial ...`

3. **Opción C**: Agregar créditos a OpenAI
   - URL: https://platform.openai.com/account/billing/overview
   - Cambiar en .env: `MODEL_PO=gpt-4-turbo` y `MODEL_SCRUM=gpt-4-turbo`

### Fase 2: Iniciar SaaSFinancial (cuando tengas API disponible)
```bash
# 1. Configurar BD
npx ts-node orchestrator/orchestrator.ts saasfinancial \
  "Eres el DBA. Configura PostgreSQL: crea la BD, tablas, índices y seedea datos iniciales según context.md"

# 2. PO define primeras HUs
npx ts-node orchestrator/orchestrator.ts saasfinancial \
  "Eres el PO. Lee context.md. Define 5 primeras Historias de Usuario con criterios de aceptación."

# 3. Scrum Master planifica
npx ts-node orchestrator/orchestrator.ts saasfinancial \
  "Eres el Scrum Master. Lee las HUs y crea un sprint.json con tareas desglosadas."

# 4. Backend comienza
npx ts-node orchestrator/orchestrator.ts saasfinancial \
  "Eres el Backend Developer. Crea la estructura de carpetas y el primera endpoint GET /organizations"
```

### Fase 3: Iniciar Ecommerce (similar a Fase 2)
```bash
npx ts-node orchestrator/orchestrator.ts ecommerce \
  "Eres el DBA. Configura PostgreSQL para ecommerce..."
```

## Comandos útiles

```bash
# Verificar compilación
npx tsc --noEmit

# Ejecutar un agente
npx ts-node orchestrator/orchestrator.ts <proyecto> "<tarea>"

# Ver variables .env
cat .env | grep -E "(AGENTS_ROOT|MODEL_|SAASFINANCIAL|ECOMMERCE)"

# Ver estructura de carpetas
tree -L 2 projects-memories/

# Leer context de un proyecto
cat projects-memories/saasfinancial/context.md | head -50
```

## Notas técnicas

1. **AGENTS_ROOT debe ser raíz del proyecto**, no `/agents`, porque:
   - `orchestrator.ts` busca: `path.join(AGENTS_ROOT, "projects-memories", projectName)`
   - Si AGENTS_ROOT=/root/agents, buscaría en /root/agents/projects-memories
   - Pero projects-memories está en /root (un nivel arriba)

2. **Nombres de proyectos**:
   - En código: minúsculas (saasfinancial, ecommerce)
   - En .env: MAYÚSCULAS (SAASFINANCIAL_*, ECOMMERCE_*)
   - Orquestador los convierte: `projectName.toUpperCase()`

3. **Modelos detectados automáticamente**:
   - Prefijo `claude-*` → Anthropic SDK
   - Prefijo `gemini-*` → Google Generative AI SDK
   - Prefijo `gpt-*` → OpenAI SDK
   - Se detectan en `createProvider()` de `orchestrator/providers/base.ts`

4. **No clonar repos aún**:
   - Los repos (`/Backend`, `/Frontend`, `/BD`, `/Test`) NO existen todavía
   - El **DBA agente es responsable** de crearlos y configurar BD
   - El **Backend agente** crea estructura de carpetas en Backend/
   - El **Frontend agente** crea estructura en Frontend/

## Archivos críticos (NO modificar)

- `PROMPT_INICIAL_CLAUDE_CODE.md` → instrucciones originales
- `orchestrator/orchestrator.example.ts` → ejemplo de uso
- `projects-memories/example-project/` → ejemplo
- `projects-memories/context_example.md` → plantilla

## Archivos a monitorear

- `.env` → cambios en modelos, rutas
- `CLAUDE.md` → memoria del proyecto (tú lees esto)
- `.claude/*.md` → detalles adicionales
- `projects-memories/{proyecto}/context.md` → definición del proyecto (generado una vez)
- `projects-memories/{proyecto}/tasks.json` → tareas dinámicas (actualizado por agentes)
- `projects-memories/{proyecto}/memory-*.md` → memoria por agente (actualizado por agentes)

## Última sesión

**Fecha**: 24 Mar 2026
**Duración**: ~30 min
**Logros**: Setup 100% completado, contextos detallados, CLAUDE.md creado
**Bloqueante**: Necesita créditos en APIs
**Próxima acción**: Agregar créditos a Anthropic o esperar reset de Gemini free tier
