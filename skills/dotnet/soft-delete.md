# Skill: Eliminación Lógica
# Stack: PostgreSQL + .NET / C#
# Agentes: DBA, Backend
# Leer antes de: implementar cualquier operación de eliminación

---

## El principio

Nunca se eliminan registros físicamente de la BD.
En su lugar, se marca el registro como inactivo con `activo = FALSE`.

```
❌ DELETE FROM alumnos WHERE id = 1;
✅ UPDATE alumnos SET activo = FALSE, actualizado_en = NOW() WHERE id = 1;
```

---

## En la base de datos — columnas obligatorias

Toda tabla que soporte eliminación lógica debe tener:

```sql
activo          BOOLEAN      NOT NULL DEFAULT TRUE,
creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```

### Índice parcial para consultas eficientes

```sql
-- Solo indexa los registros activos — más pequeño y rápido
CREATE INDEX IF NOT EXISTS idx_{tabla}_activo
    ON {tabla}(activo) WHERE activo = TRUE;
```

---

## Stored Procedure de eliminación lógica

```sql
CREATE OR REPLACE FUNCTION public.eliminar_alumno(
    p_alumno_id  BIGINT,
    p_usuario_id BIGINT  -- quién lo está eliminando (auditoría)
)
RETURNS BOOLEAN  -- TRUE si se eliminó, FALSE si no existía
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE alumnos
    SET
        activo         = FALSE,
        actualizado_en = NOW()
    WHERE id     = p_alumno_id
      AND activo = TRUE;  -- solo elimina si está activo

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Registrar en auditoría si tienes tabla de logs
    -- INSERT INTO audit_log (tabla, registro_id, accion, usuario_id, fecha)
    -- VALUES ('alumnos', p_alumno_id, 'DELETE', p_usuario_id, NOW());

    RETURN v_count > 0;
END;
$$;
```

---

## En el backend — Repository

```csharp
// En IAlumnoRepository
Task<bool> DeleteAsync(long id);

// Implementación
public async Task<bool> DeleteAsync(long id)
{
    var alumno = await _context.Alumnos
        .FirstOrDefaultAsync(a => a.Id == id && a.Activo);

    if (alumno is null) return false;

    // Eliminación lógica — nunca _context.Alumnos.Remove(alumno)
    alumno.Activo        = false;
    alumno.ActualizadoEn = DateTime.UtcNow;

    await _context.SaveChangesAsync();
    return true;
}
```

---

## En el backend — Service

```csharp
public async Task<bool> DeleteAsync(long id)
{
    var eliminado = await _repository.DeleteAsync(id);

    if (!eliminado)
        throw new NotFoundException($"Alumno con ID {id} no encontrado o ya inactivo.");

    return true;
}
```

---

## En el backend — Controller

```csharp
/// <summary>Elimina un alumno (eliminación lógica)</summary>
/// <response code="204">Eliminado correctamente</response>
/// <response code="404">Alumno no encontrado</response>
[HttpDelete("{id}")]
[ProducesResponseType(StatusCodes.Status204NoContent)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> Delete(long id)
{
    await _service.DeleteAsync(id);
    return NoContent();
}
```

---

## Filtros en consultas — siempre filtrar por activo

```csharp
// ❌ MAL — devuelve registros eliminados
var alumnos = await _context.Alumnos.ToListAsync();

// ✅ BIEN — solo registros activos
var alumnos = await _context.Alumnos
    .Where(a => a.Activo)
    .ToListAsync();
```

### Global Query Filter — aplica automáticamente en todo el contexto

```csharp
// En DbContext.OnModelCreating — aplica el filtro en todos los queries
modelBuilder.Entity<Alumno>().HasQueryFilter(a => a.Activo);
modelBuilder.Entity<Venta>().HasQueryFilter(v => v.Activo);

// Para ignorar el filtro cuando necesitas ver eliminados:
var todos = await _context.Alumnos
    .IgnoreQueryFilters()
    .ToListAsync();
```

**Recomendación:** usa `HasQueryFilter` para evitar olvidar el filtro en algún query.

---

## En el frontend — el registro desaparece de la UI

```typescript
// En el store — después de eliminar, quita el registro de la lista local
async function eliminar(id: number) {
  await alumnoService.delete(id)
  alumnos.value = alumnos.value.filter(a => a.id !== id)
  // No necesitas re-fetch — el backend ya no lo devuelve
}
```

---

## Cuándo NO usar eliminación lógica

En algunos casos sí aplica eliminación física:
- Registros de sesión o tokens expirados
- Logs y auditorías (nunca se deben modificar)
- Datos temporales de proceso

Para estos casos, documenta explícitamente en el contexto del proyecto que se usa `DELETE` físico.

---

## Checklist antes de marcar como terminado

- [ ] Tabla tiene columnas `activo`, `creado_en`, `actualizado_en`
- [ ] Índice parcial `WHERE activo = TRUE` creado
- [ ] Repository usa `activo = FALSE` en vez de `Remove()`
- [ ] Todos los queries filtran por `activo = TRUE` (o se usa `HasQueryFilter`)
- [ ] Controller devuelve 204 No Content en delete exitoso
- [ ] Store del frontend quita el registro de la lista local tras eliminar
