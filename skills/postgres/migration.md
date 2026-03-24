# Skill: Migraciones SQL Versionadas
# Stack: PostgreSQL
# Agente: DBA
# Leer antes de: crear o modificar cualquier tabla

---

## Nomenclatura de archivos

```
{NNN}_{verbo}_{entidad}_{detalle}.sql

Ejemplos:
  001_crear_tabla_alumnos.sql
  002_crear_tabla_calificaciones.sql
  003_agregar_columna_email_alumnos.sql
  004_crear_indice_curp_alumnos.sql
  005_crear_sp_obtener_alumno.sql
```

- `NNN` → número secuencial de 3 dígitos, sin saltar números
- Verbo → `crear`, `agregar`, `modificar`, `eliminar`, `crear_indice`, `crear_sp`
- Todo en snake_case

---

## Estructura base obligatoria — toda migración tiene UP y DOWN

```sql
-- ============================================================
-- Migración: 001_crear_tabla_alumnos.sql
-- Descripción: Crea la tabla principal de alumnos
-- Autor: DBA Agent
-- Fecha: YYYY-MM-DD
-- ============================================================

-- ======================== UP ========================
-- (lo que hace la migración)

CREATE TABLE IF NOT EXISTS alumnos (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre       VARCHAR(100)  NOT NULL,
    ap_paterno   VARCHAR(100)  NOT NULL,
    ap_materno   VARCHAR(100),
    curp         VARCHAR(18)   NOT NULL,
    fecha_nac    DATE          NOT NULL,
    grupo_id     BIGINT,
    activo       BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================== DOWN ========================
-- (cómo revertirla — debe dejar la BD como estaba antes)

-- DROP TABLE IF EXISTS alumnos;
```

El DOWN va **comentado** — se activa manualmente solo si hay que hacer rollback.

---

## Tipos de datos — convenciones

```sql
-- IDs
BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
-- Nunca SERIAL ni BIGSERIAL en tablas nuevas

-- Textos
VARCHAR(N)    -- longitud conocida y fija (nombre, curp, email)
TEXT          -- longitud variable o desconocida (descripción, notas)

-- Números
INTEGER       -- enteros pequeños (parcial, cantidad)
BIGINT        -- enteros grandes (IDs foráneos, contadores)
NUMERIC(10,2) -- decimales exactos (montos, calificaciones)

-- Fechas
DATE          -- solo fecha (fecha_nacimiento, fecha_ingreso)
TIMESTAMPTZ   -- fecha + hora + zona (creado_en, actualizado_en)
-- Nunca TIMESTAMP sin zona

-- Booleanos
BOOLEAN NOT NULL DEFAULT TRUE/FALSE
-- Nunca VARCHAR para booleanos

-- JSON
JSONB         -- siempre JSONB, nunca JSON
```

---

## Tabla completa — ejemplo de referencia

```sql
CREATE TABLE IF NOT EXISTS ventas (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    folio           VARCHAR(20)    NOT NULL,
    cliente_id      BIGINT         NOT NULL,
    vendedor_id     BIGINT         NOT NULL,
    total           NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
    descuento       NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
    metadata        JSONB,                          -- datos adicionales variables
    activo          BOOLEAN        NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ventas_cliente  FOREIGN KEY (cliente_id)  REFERENCES clientes(id),
    CONSTRAINT fk_ventas_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    CONSTRAINT uq_ventas_folio    UNIQUE (folio),
    CONSTRAINT ck_ventas_total    CHECK (total >= 0),
    CONSTRAINT ck_ventas_descuento CHECK (descuento >= 0)
);

-- Índices siempre en la misma migración que la tabla
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id   ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor_id  ON ventas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_creado_en    ON ventas(creado_en);
CREATE INDEX IF NOT EXISTS idx_ventas_activo       ON ventas(activo) WHERE activo = TRUE;
```

---

## Modificar una tabla existente — siempre migración nueva

```sql
-- ============================================================
-- Migración: 003_agregar_columna_email_alumnos.sql
-- Descripción: Agrega email a la tabla alumnos
-- ============================================================

-- ======================== UP ========================

ALTER TABLE alumnos
    ADD COLUMN IF NOT EXISTS email VARCHAR(200);

-- Índice si el campo se usará en búsquedas
CREATE INDEX IF NOT EXISTS idx_alumnos_email ON alumnos(email);

-- ======================== DOWN ========================

-- DROP INDEX IF EXISTS idx_alumnos_email;
-- ALTER TABLE alumnos DROP COLUMN IF EXISTS email;
```

---

## Constraints — nombrado obligatorio

```
Prefijos:
  fk_  → Foreign Key  → fk_{tabla}_{campo}
  uq_  → Unique       → uq_{tabla}_{campo}
  ck_  → Check        → ck_{tabla}_{condicion}
  pk_  → Primary Key  → pk_{tabla} (opcional, PostgreSQL lo genera)
  idx_ → Index        → idx_{tabla}_{campo}

Ejemplos:
  CONSTRAINT fk_calificaciones_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
  CONSTRAINT uq_alumnos_curp UNIQUE (curp)
  CONSTRAINT ck_calificaciones_valor CHECK (valor BETWEEN 0 AND 10)
```

---

## Reglas importantes

1. **Siempre `IF NOT EXISTS` / `IF EXISTS`** — las migraciones deben ser idempotentes
2. **Nunca modificar una migración ya aplicada** — crea una nueva
3. **Índices en la misma migración que la tabla** — nunca después
4. **`BIGINT GENERATED ALWAYS AS IDENTITY`** — nunca SERIAL ni BIGSERIAL
5. **`TIMESTAMPTZ`** — nunca TIMESTAMP sin zona horaria
6. **DOWN siempre presente** aunque vaya comentado

---

## Checklist antes de marcar la migración como terminada

- [ ] Archivo nombrado con numeración secuencial correcta
- [ ] Comentario de cabecera con descripción, autor y fecha
- [ ] Sección UP con `IF NOT EXISTS`
- [ ] Sección DOWN comentada y correcta
- [ ] Tipos de datos según convenciones
- [ ] Índices incluidos en la misma migración
- [ ] Constraints nombrados con prefijo correcto
- [ ] Probada con UP y DOWN en entorno de desarrollo
