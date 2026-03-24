# mcp/

Configuración de los servidores MCP disponibles para el equipo de agentes.

---

## ¿Qué es MCP?

Model Context Protocol es el estándar que permite a los agentes de IA interactuar con el mundo exterior: archivos, bases de datos, repositorios, internet, etc.

Los servidores MCP **no se instalan manualmente** — `npx` los descarga y ejecuta automáticamente cuando se necesitan. La primera ejecución tarda unos segundos; después usa caché.

---

## Estructura

```
mcp/
├── config.json    ← configuración de todos los MCP servers disponibles
├── README.md      ← este archivo
└── custom/        ← servidores MCP propios (cuando los necesites)
    └── README.md
```

---

## Configuración inicial — Lo que debes reemplazar en config.json

Antes de usar el sistema, reemplaza estos valores en `config.json`:

| Placeholder | Qué poner |
|---|---|
| `TU_USUARIO` | Tu usuario de Linux (ej: `derian`) |
| `USUARIO` | Usuario de PostgreSQL |
| `PASSWORD` | Contraseña de PostgreSQL |
| `NOMBRE_BD` | Nombre de tu base de datos |
| `TU_GITHUB_TOKEN` | Tu Personal Access Token de GitHub |
| `TU_BRAVE_API_KEY` | Tu API Key de Brave Search |

### ¿Cómo obtener el GitHub Token?
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Scopes necesarios: `repo`, `read:org`
4. Copia el token — solo se muestra una vez

### ¿Cómo obtener la Brave API Key?
1. Entra a [brave.com/search/api](https://brave.com/search/api)
2. Crea una cuenta gratuita
3. El plan gratuito incluye 2,000 consultas/mes — suficiente para desarrollo

---

## Servidores disponibles

### filesystem
Permite leer y escribir archivos en las rutas permitidas.

**Tools que expone:**
- `read_file` → leer contenido de un archivo
- `write_file` → crear o sobrescribir un archivo
- `list_directory` → listar contenido de una carpeta
- `create_directory` → crear carpeta nueva
- `move_file` → mover o renombrar archivo
- `search_files` → buscar archivos por nombre o contenido

**Rutas permitidas por defecto:**
```
/home/TU_USUARIO/projects   → tus proyectos
/home/TU_USUARIO/agents     → este repositorio
```
> Para añadir más rutas, agrégalas como argumentos adicionales en `config.json`.

---

### postgres
Permite ejecutar consultas SQL directamente sobre tu base de datos.

**Tools que expone:**
- `query` → ejecuta cualquier SQL y devuelve el resultado

> ⚠️ **Seguridad:** Crea un usuario de BD con permisos de solo lectura para los agentes que no necesitan escribir (Scrum Master, Tester en modo verificación). Solo el DBA debería usar un usuario con permisos de escritura.

**Ejemplo de usuario de solo lectura en PostgreSQL:**
```sql
CREATE USER agente_readonly WITH PASSWORD 'password';
GRANT CONNECT ON DATABASE nombre_bd TO agente_readonly;
GRANT USAGE ON SCHEMA public TO agente_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agente_readonly;
```

---

### git
Permite operar sobre repositorios Git locales.

**Tools que expone:**
- `git_status` → estado actual del repo
- `git_diff` → cambios pendientes
- `git_log` → historial de commits
- `git_create_branch` → crear rama nueva (`feat-HU{numero}`)
- `git_checkout` → cambiar de rama
- `git_add` → agregar archivos al staging
- `git_commit` → hacer commit con el mensaje
- `git_push` → subir cambios al remoto

---

### github
Permite interactuar con repositorios remotos en GitHub.

**Tools que expone:**
- `create_pull_request` → abrir un PR
- `list_issues` → ver issues abiertos
- `create_issue` → crear un issue nuevo
- `get_file_contents` → leer archivos del repo remoto
- `push_files` → subir archivos al repo

---

### brave-search
Permite buscar información actualizada en internet.

**Tools que expone:**
- `brave_web_search` → busca en internet y devuelve los resultados más relevantes

**Usos comunes en el equipo:**
- Backend/Frontend: buscar documentación de librerías
- PO: buscar referencias y estándares del dominio
- Tester: buscar patrones de testing para casos específicos

---

## Qué MCP tiene cada agente

El orquestador controla qué tools ve cada agente. Un agente **no puede usar** un MCP que no tiene asignado.

| Agente | filesystem | postgres | git | github | brave-search |
|---|:---:|:---:|:---:|:---:|:---:|
| PO | — | — | — | — | ✅ |
| Scrum Master | ✅ | — | — | — | — |
| DBA | ✅ | ✅ | ✅ | ✅ | — |
| Backend | ✅ | — | ✅ | ✅ | ✅ |
| Frontend | ✅ | — | ✅ | ✅ | ✅ |
| Tester | ✅ | ✅ | ✅ | ✅ | ✅ |
| DocGen | ✅ | — | ✅ | ✅ | — |

---

## Servidores MCP custom

La carpeta `custom/` está reservada para servidores MCP que tú construyas. Se crean cuando necesitas conectar a algo que no existe en los servidores oficiales — por ejemplo, la API de un sistema propio como SEMOV.

Consulta `custom/README.md` cuando estés listo para crear uno.

---

## Fuentes de servidores MCP adicionales

Si en el futuro necesitas más servidores:
- **Oficiales de Anthropic:** [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- **Directorio comunidad:** [mcpservers.org](https://mcpservers.org)
- **npm:** `npm search mcp-server`
