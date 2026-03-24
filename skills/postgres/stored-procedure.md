# Skill: Stored Procedures
# Stack: PostgreSQL
# Agente: DBA
# Leer antes de: crear cualquier stored procedure

---

## Estructura base obligatoria

```sql
CREATE OR REPLACE FUNCTION {esquema}.{nombre_funcion}(
    p_{parametro1} {tipo},
    p_{parametro2} {tipo}
)
RETURNS {tipo_retorno}
LANGUAGE plpgsql
AS $$
DECLARE
    v_{variable} {tipo};
BEGIN
    -- lógica aquí

    RETURN {valor};

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en {nombre_funcion}: %', SQLERRM;
END;
$$;
```

**Convenciones de nombres:**
- Parámetros de entrada: prefijo `p_` → `p_alumno_id`, `p_folio`
- Variables locales: prefijo `v_` → `v_count`, `v_resultado`
- Nombre de función: snake_case, verbo + sustantivo → `obtener_alumno`, `registrar_venta`
- Esquema: siempre explícito → `public.obtener_alumno()`

---

## Función que devuelve un registro

```sql
CREATE OR REPLACE FUNCTION public.obtener_alumno(
    p_alumno_id BIGINT
)
RETURNS TABLE (
    id          BIGINT,
    nombre      VARCHAR,
    ap_paterno  VARCHAR,
    curp        VARCHAR,
    activo      BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.nombre,
        a.ap_paterno,
        a.curp,
        a.activo
    FROM alumnos a
    WHERE a.id = p_alumno_id
      AND a.activo = TRUE;

    -- Si no encontró nada, devuelve vacío (no error)
    -- El backend decide qué hacer con el resultado vacío
END;
$$;
```

---

## Función que devuelve múltiples registros con filtros

```sql
CREATE OR REPLACE FUNCTION public.listar_alumnos_por_grupo(
    p_grupo_id   BIGINT,
    p_solo_activos BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id          BIGINT,
    nombre      VARCHAR,
    ap_paterno  VARCHAR,
    promedio    NUMERIC(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.nombre,
        a.ap_paterno,
        COALESCE(AVG(c.valor), 0.00)::NUMERIC(5,2) AS promedio
    FROM alumnos a
    LEFT JOIN calificaciones c ON c.alumno_id = a.id
    WHERE a.grupo_id = p_grupo_id
      AND (p_solo_activos = FALSE OR a.activo = TRUE)
    GROUP BY a.id, a.nombre, a.ap_paterno
    ORDER BY a.ap_paterno, a.nombre;
END;
$$;
```

---

## Función con transacción (INSERT/UPDATE/DELETE)

```sql
CREATE OR REPLACE FUNCTION public.registrar_calificacion(
    p_alumno_id  BIGINT,
    p_materia_id BIGINT,
    p_parcial    INTEGER,
    p_valor      NUMERIC(5,2),
    p_usuario_id BIGINT
)
RETURNS BIGINT  -- devuelve el ID del registro creado
LANGUAGE plpgsql
AS $$
DECLARE
    v_calificacion_id BIGINT;
    v_count           INTEGER;
BEGIN
    -- Validaciones antes de cualquier escritura
    IF p_parcial NOT BETWEEN 1 AND 3 THEN
        RAISE EXCEPTION 'El parcial debe ser 1, 2 o 3. Recibido: %', p_parcial;
    END IF;

    IF p_valor NOT BETWEEN 0 AND 10 THEN
        RAISE EXCEPTION 'La calificación debe estar entre 0 y 10. Recibida: %', p_valor;
    END IF;

    -- Verificar que no exista ya una calificación para ese parcial
    SELECT COUNT(*) INTO v_count
    FROM calificaciones
    WHERE alumno_id  = p_alumno_id
      AND materia_id = p_materia_id
      AND parcial    = p_parcial
      AND activo     = TRUE;

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Ya existe una calificación para alumno %, materia %, parcial %',
            p_alumno_id, p_materia_id, p_parcial;
    END IF;

    -- Insertar
    INSERT INTO calificaciones (alumno_id, materia_id, parcial, valor, registrado_por, fecha_registro)
    VALUES (p_alumno_id, p_materia_id, p_parcial, p_valor, p_usuario_id, NOW())
    RETURNING id INTO v_calificacion_id;

    RETURN v_calificacion_id;

EXCEPTION
    WHEN OTHERS THEN
        -- RAISE relanza el error original si ya es un RAISE EXCEPTION
        RAISE;
END;
$$;
```

---

## Cómo llamar el SP desde .NET / Entity Framework

```csharp
// En el Repository
public async Task<AlumnoDto?> ObtenerAlumnoAsync(long alumnoId)
{
    return await _context.Database
        .SqlQuery<AlumnoDto>(
            $"SELECT * FROM public.obtener_alumno({alumnoId})"
        )
        .FirstOrDefaultAsync();
}

public async Task<long> RegistrarCalificacionAsync(
    long alumnoId, long materiaId, int parcial, decimal valor, long usuarioId)
{
    var result = await _context.Database
        .SqlQueryRaw<long>(
            "SELECT public.registrar_calificacion(@alumnoId, @materiaId, @parcial, @valor, @usuarioId)",
            new NpgsqlParameter("alumnoId",  alumnoId),
            new NpgsqlParameter("materiaId", materiaId),
            new NpgsqlParameter("parcial",   parcial),
            new NpgsqlParameter("valor",     valor),
            new NpgsqlParameter("usuarioId", usuarioId)
        )
        .FirstAsync();

    return result;
}
```

---

## Reglas importantes

1. **Validaciones primero** — antes de cualquier INSERT/UPDATE/DELETE
2. **Nunca DELETE físico** — usa `activo = FALSE` (ver skill de eliminación lógica)
3. **RAISE EXCEPTION con mensaje descriptivo** — el backend lo captura y lo devuelve
4. **Parámetros con prefijo `p_`**, variables con prefijo `v_`
5. **RETURNS TABLE** para múltiples columnas, tipo directo para un valor
6. **Esquema siempre explícito** en el nombre de la función

---

## Checklist antes de marcar el SP como terminado

- [ ] Parámetros con prefijo `p_`, variables con prefijo `v_`
- [ ] Validaciones al inicio, antes de cualquier escritura
- [ ] RAISE EXCEPTION con mensaje claro en cada validación
- [ ] No hace DELETE físico — elimina lógicamente
- [ ] Probado con casos válidos e inválidos directamente en la BD
- [ ] Migración versionada que lo crea incluida
