# PROMPT_INICIAL_CLAUDE_CODE.md
# Pega este prompt en Claude Code al abrir tu repo privado por primera vez.
# Llena las secciones marcadas con [TU_...] antes de ejecutarlo.

---

Hola Claude Code. Vamos a configurar mi sistema de multi-agentes de IA para desarrollo de software. Ya tengo el repo base en GitHub con toda la estructura. Necesito que me ayudes a configurar mi versión privada con mis datos reales.

## Lo que ya existe en el repo

```
agents/
├── roles/          → 7 agentes definidos (po, scrum, dba, backend, frontend, tester, docs)
├── skills/         → skills base en dotnet/, vue3/, postgres/
├── conventions.md  → ramas, commits, nomenclatura
├── prompts/        → vacío, se llena con el uso
├── projects-memories/
│   ├── context_example.md
│   └── example-project/ → ejemplos de contratos y tasks
├── mcp/
│   ├── config.json → con placeholders
│   └── custom/
├── orchestrator/
│   ├── orchestrator.ts
│   └── orchestrator.example.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Paso 1 — Crear el .env con mis datos reales

Crea el archivo `.env` en la raíz del repo con estos valores:

```
ANTHROPIC_API_KEY=[TU_ANTHROPIC_API_KEY]
OPENAI_API_KEY=[TU_OPENAI_API_KEY]
GOOGLE_API_KEY=[TU_GOOGLE_API_KEY]

GITHUB_PERSONAL_ACCESS_TOKEN=[TU_GITHUB_TOKEN]
BRAVE_API_KEY=[TU_BRAVE_API_KEY]

POSTGRES_CONNECTION_STRING=[TU_CONNECTION_STRING]

PROJECTS_ROOT=[RUTA_ABSOLUTA_A_TUS_PROYECTOS]
AGENTS_ROOT=[RUTA_ABSOLUTA_A_ESTA_CARPETA]

DEFAULT_MODEL=claude-sonnet-4-5
```

## Paso 2 — Actualizar mcp/config.json con mis rutas reales

Reemplaza los placeholders en `mcp/config.json`:
- `TU_USUARIO` → [TU_USUARIO_LINUX]
- `TU_GITHUB_TOKEN` → mismo del .env
- `TU_BRAVE_API_KEY` → mismo del .env
- `USUARIO/PASSWORD/NOMBRE_BD` → [TU_POSTGRES_CONNECTION]

Las rutas permitidas del filesystem deben incluir:
- [RUTA_A_TUS_PROYECTOS]
- [RUTA_A_ESTA_CARPETA_AGENTS]

## Paso 3 — Instalar dependencias

```bash
npm install
```

Verifica que el orquestador compila sin errores:
```bash
npx tsc --noEmit
```

## Paso 4 — Crear mi primer proyecto real

Crea la carpeta `projects-memories/[NOMBRE_DE_TU_PRIMER_PROYECTO]/` con:

### context.md
Llénalo con estos datos:
- **Nombre del proyecto:** [NOMBRE]
- **Siglas:** [SIGLAS 2-5 letras]
- **Descripción:** [QUÉ HACE EL SISTEMA]
- **Usuarios:** [TIPOS DE USUARIO Y PERMISOS]
- **Stack frontend:** [TU FRAMEWORK/LIBRERÍAS]
- **Stack backend:** [TU FRAMEWORK/LENGUAJE]
- **Base de datos:** [MOTOR Y VERSIÓN]
- **Testing backend:** [FRAMEWORK]
- **Testing E2E:** [FRAMEWORK]
- **Rutas de repos:**
  - back-repo: [RUTA]
  - front-repo: [RUTA]
  - db-repo: [RUTA]
  - test-repo: [RUTA]
- **Reglas de negocio importantes:** [LISTA]
- **Entidades principales:** [LISTA]

### Carpeta contracts/
Créala vacía — los contratos se generarán cuando el Backend proponga el primer endpoint.

## Paso 5 — Verificar que el orquestador funciona

Haz una prueba básica con el Scrum Master:

```bash
npx ts-node orchestrator/orchestrator.ts [NOMBRE_PROYECTO] "Dame el estado actual del proyecto"
```

Si no hay tasks.json aún, el Scrum debe indicar que el proyecto está en fase inicial y sugerir empezar por el PO definiendo las HUs.

## Paso 6 — Primera sesión real

Una vez todo esté configurado, ejecuta:

```bash
npx ts-node orchestrator/orchestrator.ts [NOMBRE_PROYECTO] "Necesito comenzar el proyecto. El PO debe definir las primeras Historias de Usuario."
```

---

## Cosas a verificar antes de continuar

- [ ] `.env` creado con todos los valores reales
- [ ] `mcp/config.json` actualizado con rutas reales
- [ ] `npm install` ejecutado sin errores
- [ ] `npx tsc --noEmit` sin errores de tipos
- [ ] `context.md` del proyecto creado y completo
- [ ] Prueba básica del orquestador exitosa

## Notas importantes

- El `.env` NUNCA se sube al repo — está en el `.gitignore`
- Los `context.md` de proyectos reales tampoco se suben
- Los `memory-*.md` tampoco se suben
- El `tasks.json` real tampoco se sube
- Solo se suben cambios a `roles/`, `skills/`, `conventions.md`, `orchestrator/`, `mcp/` (sin tokens)

Cuando termines la configuración, dime y comenzamos con la primera HU del proyecto.
