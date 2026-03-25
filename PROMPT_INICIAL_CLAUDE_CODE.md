# PROMPT_INICIAL_CLAUDE_CODE.md
# Pega este prompt en Claude Code al abrir tu repo privado.
# Llena todas las secciones marcadas con [MAYÚSCULAS] antes de ejecutarlo.
# NO incluyas tus API keys aquí — Claude Code las leerá del .env que crearemos.

---

Hola Claude Code. Vamos a configurar mi sistema de multi-agentes de IA.
Ya tengo el repo base clonado. Necesito que lo configures con mis datos reales.

## Estructura del repo (ya existe)

```
agents/
├── roles/           → 7 agentes (po, scrum, dba, backend, frontend, tester, docs)
├── skills/          → dotnet/, vue3/, postgres/
├── conventions.md
├── projects-memories/
│   └── context_example.md
├── mcp/config.json  → plantilla con variables de entorno
├── orchestrator/
│   ├── orchestrator.ts
│   ├── orchestrator.example.ts
│   └── providers/   → base.ts, anthropic.ts, google.ts, openai.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Paso 1 — Crear el .env

Crea el archivo `.env` en la raíz del repo con este contenido exacto,
reemplazando los valores entre corchetes:

```env
# Rutas base
AGENTS_ROOT=[RUTA_ABSOLUTA_DE_ESTA_CARPETA]
PROJECTS_ROOT=[RUTA_ABSOLUTA_DE_TU_CARPETA_DE_PROYECTOS]

# API Keys
ANTHROPIC_API_KEY=[TU_ANTHROPIC_API_KEY]
GOOGLE_API_KEY=[TU_GOOGLE_API_KEY]
OPENAI_API_KEY=[TU_OPENAI_API_KEY]
GITHUB_PERSONAL_ACCESS_TOKEN=[TU_GITHUB_TOKEN]
BRAVE_API_KEY=[TU_BRAVE_API_KEY]

# Modelos por agente
MODEL_PO=claude-opus-4-6
MODEL_SCRUM=claude-opus-4-6
MODEL_DBA=gemini-2.5-pro
MODEL_BACKEND=gemini-2.5-pro
MODEL_FRONTEND=gemini-2.5-pro
MODEL_TESTER=gemini-2.5-flash
MODEL_DOCS=gemini-2.5-flash

# Proyecto: [NOMBRE_PROYECTO]
# Reemplaza NOMBRE_PROYECTO con el nombre real en mayúsculas
# Ejemplo: si el proyecto se llama "escolar", usa ESCOLAR_BACK, ESCOLAR_FRONT, etc.
[NOMBRE_PROYECTO]_BACK=[RUTA_ABSOLUTA]/back-repo
[NOMBRE_PROYECTO]_FRONT=[RUTA_ABSOLUTA]/front-repo
[NOMBRE_PROYECTO]_DB=[RUTA_ABSOLUTA]/db-repo
[NOMBRE_PROYECTO]_TEST=[RUTA_ABSOLUTA]/test-repo
[NOMBRE_PROYECTO]_POSTGRES=postgresql://[USUARIO]:[PASSWORD]@localhost:5432/[NOMBRE_BD]
```

Si tienes más proyectos, agrega un bloque adicional por cada uno siguiendo el mismo patrón.

---

## Paso 2 — Instalar dependencias

```bash
npm install
```

Verifica que compila sin errores:
```bash
npx tsc --noEmit
```

Si hay errores de tipos, corrígelos antes de continuar.
## Paso 2.5 — Generar los agents/*.ts

Crea un archivo por agente en la carpeta `agents/`:
- po.ts, scrum.ts, dba.ts, backend.ts, frontend.ts, tester.ts, docs.ts

Cada archivo debe:
1. Importar `runAgent` del orquestador
2. Exportar una función `run(task, projectName)` que llame a `runAgent`
3. Ser un wrapper simple — sin lógica adicional
---

## Paso 3 — Crear el context.md del proyecto

Crea la carpeta y el archivo:
```bash
mkdir -p projects-memories/[nombre_proyecto_en_minúsculas]/contracts
cp projects-memories/context_example.md projects-memories/[nombre_proyecto_en_minúsculas]/context.md
```

Llena el `context.md` con los datos reales del proyecto:
- Nombre del proyecto
- Siglas (2-5 letras mayúsculas, ejemplo: `SIGLAS: ESC`)
- Descripción del sistema
- Tipos de usuario y permisos
- Stack frontend
- Stack backend
- Motor de base de datos y versión
- Framework de testing backend
- Framework de testing E2E
- Reglas de negocio importantes
- Entidades principales del sistema

**Nota importante:** El nombre de la carpeta del proyecto debe coincidir
en minúsculas con el prefijo de las variables del .env.
Ejemplo: carpeta `escolar` → variables `ESCOLAR_BACK`, `ESCOLAR_POSTGRES`, etc.

---

## Paso 4 — Verificar la configuración completa

Corre este checklist:

```bash
# 1. Verificar que el .env tiene todos los valores
cat .env | grep -E "(AGENTS_ROOT|PROJECTS_ROOT|API_KEY|MODEL_)" 

# 2. Verificar que el context.md existe
ls projects-memories/[nombre_proyecto]/context.md

# 3. Prueba básica del orquestador
npx ts-node orchestrator/orchestrator.ts [nombre_proyecto] "Dame el estado actual del proyecto"
```

Si el Scrum Master responde (aunque sea diciendo que no hay tasks.json aún),
la configuración está correcta.

---

## Paso 5 — Primera sesión real

```bash
npx ts-node orchestrator/orchestrator.ts [nombre_proyecto] \
  "Iniciamos el proyecto. El PO debe definir las primeras Historias de Usuario."
```

El PO preguntará sobre los requerimientos del sistema usando la información
del context.md. Respóndele y comenzará a generar las primeras HUs.

---

## Checklist final

- [ ] `.env` creado con todas las variables reales
- [ ] `npm install` sin errores
- [ ] `npx tsc --noEmit` sin errores de tipos
- [ ] `context.md` del proyecto creado y completo
- [ ] Nombre de carpeta del proyecto coincide con prefijo en .env
- [ ] Prueba básica del orquestador exitosa

---

## Qué NO subir al repo (ya está en .gitignore)

```
.env
projects-memories/*/context.md
projects-memories/*/memory-*.md
projects-memories/*/tasks.json
projects-memories/*/progress.json
projects-memories/*/contracts/*.json
```

Solo se suben cambios a:
`roles/` · `skills/` · `conventions.md` · `orchestrator/` · `mcp/` · `prompts/`
