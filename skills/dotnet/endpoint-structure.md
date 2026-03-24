# Skill: Estructura de Endpoint
# Stack: .NET 8 / C# / Clean Architecture
# Agente: Backend
# Leer antes de: crear cualquier endpoint nuevo

---

## Estructura de carpetas obligatoria

Todo endpoint nuevo sigue exactamente esta estructura de capas:

```
src/
├── API/
│   ├── Controllers/
│   │   └── {Entidad}Controller.cs
├── Application/
│   ├── {Entidad}/
│   │   ├── Queries/
│   │   │   ├── Get{Entidad}Query.cs
│   │   │   └── Get{Entidad}QueryHandler.cs
│   │   ├── Commands/
│   │   │   ├── Create{Entidad}Command.cs
│   │   │   └── Create{Entidad}CommandHandler.cs
│   │   └── DTOs/
│   │       ├── {Entidad}ResponseDto.cs
│   │       └── Create{Entidad}RequestDto.cs
├── Domain/
│   └── Entities/
│       └── {Entidad}.cs
└── Infrastructure/
    └── Repositories/
        └── {Entidad}Repository.cs
```

---

## Controller — reglas estrictas

```csharp
[ApiController]
[Route("api/[controller]")]
public class AlumnosController : ControllerBase
{
    private readonly IAlumnoService _service;

    public AlumnosController(IAlumnoService service)
    {
        _service = service;
    }

    /// <summary>Obtiene un alumno por su ID</summary>
    /// <param name="id">ID del alumno</param>
    /// <response code="200">Alumno encontrado</response>
    /// <response code="404">Alumno no encontrado</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AlumnoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Crea un nuevo alumno</summary>
    /// <response code="201">Alumno creado exitosamente</response>
    /// <response code="400">Datos inválidos</response>
    [HttpPost]
    [ProducesResponseType(typeof(AlumnoResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateAlumnoRequestDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
```

**Reglas del Controller:**
- Solo orquesta — sin lógica de negocio
- Siempre `async/await`
- Siempre documentación XML en cada método
- Siempre `[ProducesResponseType]` para cada código HTTP posible
- Inyección de dependencias por constructor únicamente

---

## Service — reglas estrictas

```csharp
public interface IAlumnoService
{
    Task<AlumnoResponseDto?> GetByIdAsync(int id);
    Task<AlumnoResponseDto> CreateAsync(CreateAlumnoRequestDto dto);
}

public class AlumnoService : IAlumnoService
{
    private readonly IAlumnoRepository _repository;

    public AlumnoService(IAlumnoRepository repository)
    {
        _repository = repository;
    }

    public async Task<AlumnoResponseDto?> GetByIdAsync(int id)
    {
        var alumno = await _repository.GetByIdAsync(id);
        if (alumno is null) return null;

        return MapToDto(alumno);
    }

    public async Task<AlumnoResponseDto> CreateAsync(CreateAlumnoRequestDto dto)
    {
        // Validaciones de negocio aquí, no en el controller
        var existe = await _repository.ExisteAsync(dto.Curp);
        if (existe)
            throw new InvalidOperationException($"Ya existe un alumno con CURP {dto.Curp}");

        var alumno = new Alumno
        {
            Nombre      = dto.Nombre,
            ApPaterno   = dto.ApPaterno,
            Curp        = dto.Curp,
            FechaIngreso = DateTime.UtcNow,
            Activo      = true
        };

        await _repository.CreateAsync(alumno);
        return MapToDto(alumno);
    }

    // Mapeo siempre en métodos estáticos privados
    private static AlumnoResponseDto MapToDto(Alumno alumno) => new()
    {
        Id        = alumno.Id,
        Nombre    = alumno.Nombre,
        ApPaterno = alumno.ApPaterno,
        Curp      = alumno.Curp
    };
}
```

**Reglas del Service:**
- Siempre define la interfaz primero
- Validaciones de negocio aquí, nunca en el Controller ni Repository
- Mapeo en métodos estáticos privados — nunca en línea
- Nunca accede a HttpContext ni a la capa de infraestructura directamente

---

## DTOs — reglas estrictas

```csharp
// Request DTO — lo que llega del cliente
public class CreateAlumnoRequestDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido paterno es obligatorio")]
    public string ApPaterno { get; set; } = string.Empty;

    [Required(ErrorMessage = "La CURP es obligatoria")]
    [RegularExpression(@"^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$",
        ErrorMessage = "CURP inválida")]
    public string Curp { get; set; } = string.Empty;
}

// Response DTO — lo que se devuelve al cliente
public class AlumnoResponseDto
{
    public int    Id        { get; set; }
    public string Nombre    { get; set; } = string.Empty;
    public string ApPaterno { get; set; } = string.Empty;
    public string Curp      { get; set; } = string.Empty;
}
```

**Reglas de los DTOs:**
- Request DTOs tienen Data Annotations de validación
- Response DTOs son simples — sin lógica, sin anotaciones
- Nunca expones la entidad del dominio directamente
- Nunca compartes el mismo DTO para request y response

---

## Códigos HTTP — referencia rápida

```
GET    → 200 OK / 404 Not Found
POST   → 201 Created / 400 Bad Request / 409 Conflict
PUT    → 200 OK / 400 Bad Request / 404 Not Found
PATCH  → 200 OK / 400 Bad Request / 404 Not Found
DELETE → 204 No Content / 404 Not Found
```

---

## Checklist antes de marcar el endpoint como terminado

- [ ] Controller sin lógica de negocio
- [ ] Documentación XML en cada método del Controller
- [ ] `[ProducesResponseType]` para cada código HTTP posible
- [ ] Interface del Service definida antes de la implementación
- [ ] Validaciones de negocio en el Service
- [ ] Mapeo en métodos estáticos privados
- [ ] Request DTO con Data Annotations
- [ ] Response DTO separado del Request DTO
- [ ] Prueba unitaria del Service escrita y pasando
