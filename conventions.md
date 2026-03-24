# conventions.md
# Convenciones de trabajo que siguen TODOS los agentes en TODOS los proyectos.

---

## Ramas

```
feat-HU{numero}

Ejemplos:
  feat-HU001
  feat-HU012
  feat-HU099
```

**Reglas:**
- Una rama por Historia de Usuario
- Se crea antes de escribir cualquier código
- Nunca se trabaja directamente en `main` o `develop`
- El número coincide con el `hu` del `tasks.json`

---

## Commits

```
{SIGLAS}{numero_commit} | {Descripción breve en imperativo}

Ejemplos:
  ESC01 | Migración tabla alumnos creada
  ESC02 | Endpoint GET /alumnos implementado
  SF01  | Componente de ingresos iniciado
  SF02  | Store de ingresos con Pinia completado
  ECOMM01 | Tabla productos creada
  ECOMM02 | CRUD de productos implementado
```

**Reglas:**
- Las siglas del proyecto se definen en el `context.md` de cada proyecto
- El número de commit es secuencial por proyecto, no por rama
- La descripción es breve (máx. 60 caracteres) y en imperativo
- Nunca se hace commit directamente en `main` o `develop`

---

## Siglas del proyecto

Las siglas se definen en `context.md` de cada proyecto bajo el campo `SIGLAS`.

| Proyecto ejemplo | Siglas |
|---|---|
| Sistema Escolar | `ESC` |
| SaaS Financiero | `SF` |
| E-commerce | `ECOMM` |
| Control de Inventario | `INV` |
| SEMOV | `SEMOV` |

**Reglas:**
- 2 a 5 letras en mayúsculas
- Únicas por proyecto — no puede haber dos proyectos con las mismas siglas
- Sin caracteres especiales ni espacios

---

## Nomenclatura de archivos de migración

```
{NNN}_{verbo}_{entidad}_{detalle}.sql

Ejemplos:
  001_crear_tabla_alumnos.sql
  002_crear_tabla_calificaciones.sql
  003_agregar_columna_email_alumnos.sql
  004_crear_indice_curp_alumnos.sql
  005_crear_sp_obtener_alumno.sql
```

**Reglas:**
- `NNN` es secuencial de 3 dígitos — sin saltarse números
- Todo en snake_case
- Verbos: `crear`, `agregar`, `modificar`, `eliminar`, `crear_indice`, `crear_sp`

---

## Nomenclatura de contratos

```
{METHOD}_{recurso}.json
{METHOD}_{recurso}_{detalle}.json

Ejemplos:
  GET_alumnos.json
  POST_alumnos.json
  GET_alumnos_{id}.json
  PUT_alumnos_{id}.json
  GET_alumnos_{id}_calificaciones.json
```

---

## Nomenclatura de IDs

| Tipo | Formato | Ejemplo |
|---|---|---|
| Historia de Usuario | `HU-{NNN}` | `HU-001` |
| Tarea | `T{NNN}` | `T001`, `T012` |
| Contrato | `CTR-{NNN}` | `CTR-001` |
| Bug | `BUG-{NNN}` | `BUG-001` |

---

## Status válidos en tasks.json

| Status | Significado |
|---|---|
| `pendiente` | No ha iniciado — esperando dependencias |
| `en_progreso` | El agente está trabajando en ella |
| `bloqueado` | No puede avanzar — hay un impedimento |
| `completado` | Terminado y validado |

## Status válidos en contracts/

| Status | Significado |
|---|---|
| `draft` | Propuesto por Backend, pendiente de aceptación |
| `agreed` | Ambos aceptaron — se puede codificar |
| `implemented` | Backend implementó y Tester validó |
| `deprecated` | Reemplazado por un contrato nuevo |
