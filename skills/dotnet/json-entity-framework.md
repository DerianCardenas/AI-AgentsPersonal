# Skill: Manejo de JSON en Entity Framework Core
# Stack: .NET 8 / C# / Entity Framework Core / PostgreSQL
# Agente: Backend
# Leer antes de: trabajar con columnas JSONB en la BD

---

## El problema

EF Core no mapea automáticamente columnas JSONB a propiedades C#.
Hay que decirle explícitamente cómo serializar/deserializar.

Además: las propiedades de navegación JSON tienen nombres en snake_case
en la BD pero PascalCase en C# — hay que mapear esa diferencia.

---

## Modelo de dominio con columna JSON

```csharp
// Domain/Entities/Tramite.cs
public class Tramite
{
    public long   Id      { get; set; }
    public string Folio   { get; set; } = string.Empty;
    public string Status  { get; set; } = string.Empty;

    // La columna JSONB se mapea como JsonDocument o como clase propia
    public JsonDocument? Metadata  { get; set; }
    public DatosVehiculo? Vehiculo { get; set; }  // objeto tipado
}

// Clase que representa el objeto JSON tipado
public class DatosVehiculo
{
    public string Marca    { get; set; } = string.Empty;
    public string Modelo   { get; set; } = string.Empty;
    public int    Año      { get; set; }
    public string Placas   { get; set; } = string.Empty;
}
```

---

## Configuración en DbContext — obligatoria

```csharp
// Infrastructure/Data/AppDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Tramite>(entity =>
    {
        entity.ToTable("tramites");

        entity.Property(t => t.Id)     .HasColumnName("id");
        entity.Property(t => t.Folio)  .HasColumnName("folio");
        entity.Property(t => t.Status) .HasColumnName("status");

        // Columna JSONB con JsonDocument (para JSON sin estructura fija)
        entity.Property(t => t.Metadata)
            .HasColumnName("metadata")
            .HasColumnType("jsonb")
            .HasConversion(
                v => v == null ? null : v.RootElement.GetRawText(),
                v => v == null ? null : JsonDocument.Parse(v)
            );

        // Columna JSONB con clase tipada (para JSON con estructura conocida)
        entity.Property(t => t.Vehiculo)
            .HasColumnName("datos_vehiculo")
            .HasColumnType("jsonb")
            .HasConversion(
                v => v == null ? null : JsonSerializer.Serialize(v, JsonOptions),
                v => v == null ? null : JsonSerializer.Deserialize<DatosVehiculo>(v, JsonOptions)
            );
    });
}

// Opciones de serialización — snake_case para coincidir con PostgreSQL
private static readonly JsonSerializerOptions JsonOptions = new()
{
    PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
    PropertyNameCaseInsensitive = true
};
```

---

## Leer propiedades de un JsonDocument

```csharp
// En el Service o Repository
public string ObtenerMarcaVehiculo(Tramite tramite)
{
    // Opción A — JsonDocument (JSON sin estructura fija)
    if (tramite.Metadata?.RootElement.TryGetProperty("marca", out var marcaEl) == true)
    {
        return marcaEl.GetString() ?? string.Empty;
    }

    // Opción B — Clase tipada (recomendada cuando la estructura es conocida)
    return tramite.Vehiculo?.Marca ?? string.Empty;
}

// Leer propiedad anidada de JsonDocument
public int? ObtenerAño(Tramite tramite)
{
    if (tramite.Metadata?.RootElement
        .TryGetProperty("datos_vehiculo", out var vehiculoEl) == true)
    {
        if (vehiculoEl.TryGetProperty("año", out var añoEl))
            return añoEl.GetInt32();
    }
    return null;
}
```

---

## Proyección en queries — IMPORTANTE

Las propiedades de un JsonDocument **no se pueden proyectar directamente** en EF.
Hay que traer el objeto completo y proyectar en memoria:

```csharp
// ❌ MAL — EF no puede traducir esto a SQL
var resultado = await _context.Tramites
    .Where(t => t.Metadata.RootElement.GetProperty("marca").GetString() == "Toyota")
    .ToListAsync();

// ✅ BIEN — trae el objeto y filtra/proyecta en memoria
var tramites = await _context.Tramites
    .Where(t => t.Status == "activo")
    .ToListAsync();  // primero materializa

var resultado = tramites
    .Where(t => t.Vehiculo?.Marca == "Toyota")  // luego filtra en memoria
    .Select(t => new TramiteResumenDto
    {
        Id    = t.Id,
        Folio = t.Folio,
        Marca = t.Vehiculo?.Marca ?? string.Empty
    })
    .ToList();
```

---

## Métodos de proyección — siempre estáticos

```csharp
// En el Service — métodos de mapeo estáticos para evitar errores de EF
private static TramiteResponseDto MapToDto(Tramite tramite) => new()
{
    Id     = tramite.Id,
    Folio  = tramite.Folio,
    Status = tramite.Status,
    Marca  = tramite.Vehiculo?.Marca,
    Modelo = tramite.Vehiculo?.Modelo,
    Año    = tramite.Vehiculo?.Año
};
```

**¿Por qué estáticos?**
Si el método no es estático, EF intenta convertirlo a SQL y falla.
Los métodos estáticos se ejecutan en memoria, no en la BD.

---

## Actualizar una columna JSON

```csharp
public async Task ActualizarVehiculoAsync(long tramiteId, DatosVehiculo vehiculo)
{
    var tramite = await _context.Tramites.FindAsync(tramiteId)
        ?? throw new NotFoundException($"Trámite {tramiteId} no encontrado");

    tramite.Vehiculo = vehiculo;

    // EF detecta el cambio y actualiza la columna JSONB
    await _context.SaveChangesAsync();
}
```

---

## Reglas importantes

1. **`PropertyNamingPolicy = SnakeCaseLower`** — las propiedades del JSON en BD son snake_case
2. **Métodos de proyección siempre estáticos** — evita errores de traducción de EF
3. **Nunca filtres por propiedades JSON en SQL** — filtra en memoria después de materializar
4. **Usa clase tipada cuando la estructura es conocida** — más seguro que JsonDocument
5. **`HasColumnType("jsonb")`** siempre explícito en la configuración

---

## Checklist antes de marcar como terminado

- [ ] Columna configurada con `HasColumnName`, `HasColumnType("jsonb")` y `HasConversion`
- [ ] Opciones de serialización con `SnakeCaseLower`
- [ ] Métodos de proyección/mapeo son estáticos
- [ ] Filtros sobre propiedades JSON se hacen en memoria, no en el query
- [ ] Prueba unitaria del mapeo verificada
