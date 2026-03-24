# Skill: Prueba Unitaria con xUnit
# Stack: .NET 8 / C# / xUnit / Moq
# Agente: Backend
# Leer antes de: escribir cualquier prueba unitaria

---

## Estructura de carpetas

```
back-repo/
└── tests/
    └── unit/
        └── {Modulo}/
            └── {NombreService}Tests.cs
```

El archivo de tests espeja la estructura del código:
```
src/Application/Alumnos/AlumnoService.cs
              ↓
tests/unit/Alumnos/AlumnoServiceTests.cs
```

---

## Estructura base de una clase de tests

```csharp
using Moq;
using Xunit;
using FluentAssertions;  // opcional pero recomendado

namespace Tests.Unit.Alumnos;

public class AlumnoServiceTests
{
    // Mocks de dependencias
    private readonly Mock<IAlumnoRepository> _repositoryMock;

    // Sistema bajo prueba (SUT)
    private readonly AlumnoService _sut;

    public AlumnoServiceTests()
    {
        _repositoryMock = new Mock<IAlumnoRepository>();
        _sut = new AlumnoService(_repositoryMock.Object);
    }

    // Los tests van aquí
}
```

---

## Nomenclatura de tests — obligatoria

```
{MetodoQueSeProeba}_{CondicionDeEntrada}_{ResultadoEsperado}

Ejemplos:
  GetByIdAsync_AlumnoExiste_DevuelveDto
  GetByIdAsync_AlumnoNoExiste_DevuelveNull
  CreateAsync_CurpDuplicada_LanzaExcepcion
  CreateAsync_DatosValidos_CreaYDevuelveDto
```

---

## Los 3 casos mínimos por método

```csharp
// ─────────────────────────────────
// CASO 1: Camino feliz
// ─────────────────────────────────
[Fact]
public async Task GetByIdAsync_AlumnoExiste_DevuelveDto()
{
    // Arrange — preparas los datos y configuras los mocks
    var alumno = new Alumno
    {
        Id        = 1,
        Nombre    = "Juan",
        ApPaterno = "García",
        Curp      = "GARJ900101HDFRCN01",
        Activo    = true
    };

    _repositoryMock
        .Setup(r => r.GetByIdAsync(1))
        .ReturnsAsync(alumno);

    // Act — ejecutas el método bajo prueba
    var resultado = await _sut.GetByIdAsync(1);

    // Assert — verificas el resultado
    resultado.Should().NotBeNull();
    resultado!.Id.Should().Be(1);
    resultado.Nombre.Should().Be("Juan");
    resultado.ApPaterno.Should().Be("García");
}

// ─────────────────────────────────
// CASO 2: Dato no encontrado / caso vacío
// ─────────────────────────────────
[Fact]
public async Task GetByIdAsync_AlumnoNoExiste_DevuelveNull()
{
    // Arrange
    _repositoryMock
        .Setup(r => r.GetByIdAsync(999))
        .ReturnsAsync((Alumno?)null);

    // Act
    var resultado = await _sut.GetByIdAsync(999);

    // Assert
    resultado.Should().BeNull();
}

// ─────────────────────────────────
// CASO 3: Error / excepción
// ─────────────────────────────────
[Fact]
public async Task CreateAsync_CurpDuplicada_LanzaExcepcion()
{
    // Arrange
    var dto = new CreateAlumnoRequestDto
    {
        Nombre    = "Juan",
        ApPaterno = "García",
        Curp      = "GARJ900101HDFRCN01"
    };

    _repositoryMock
        .Setup(r => r.ExisteAsync(dto.Curp))
        .ReturnsAsync(true);  // simula que ya existe

    // Act
    var accion = async () => await _sut.CreateAsync(dto);

    // Assert
    await accion.Should()
        .ThrowAsync<InvalidOperationException>()
        .WithMessage("*CURP*");
}
```

---

## Casos con múltiples escenarios — Theory

```csharp
[Theory]
[InlineData("",        "García", false)]  // nombre vacío
[InlineData("   ",     "García", false)]  // solo espacios
[InlineData("Juan",    "",       false)]  // apellido vacío
[InlineData("Juan",    "García", true)]   // caso válido
public async Task CreateAsync_ValidaInputs_CorrectamenteSegunCaso(
    string nombre, string apPaterno, bool debeCrear)
{
    // Arrange
    var dto = new CreateAlumnoRequestDto
    {
        Nombre    = nombre,
        ApPaterno = apPaterno,
        Curp      = "GARJ900101HDFRCN01"
    };

    _repositoryMock
        .Setup(r => r.ExisteAsync(It.IsAny<string>()))
        .ReturnsAsync(false);

    // Act & Assert
    if (debeCrear)
    {
        var resultado = await _sut.CreateAsync(dto);
        resultado.Should().NotBeNull();
    }
    else
    {
        var accion = async () => await _sut.CreateAsync(dto);
        await accion.Should().ThrowAsync<ArgumentException>();
    }
}
```

---

## Verificar que el Repository fue llamado correctamente

```csharp
[Fact]
public async Task CreateAsync_DatosValidos_LlamaRepositoryUnaVez()
{
    // Arrange
    var dto = new CreateAlumnoRequestDto { Nombre = "Juan", ApPaterno = "García", Curp = "..." };

    _repositoryMock.Setup(r => r.ExisteAsync(It.IsAny<string>())).ReturnsAsync(false);
    _repositoryMock.Setup(r => r.CreateAsync(It.IsAny<Alumno>())).Returns(Task.CompletedTask);

    // Act
    await _sut.CreateAsync(dto);

    // Assert — verifica que se llamó exactamente una vez
    _repositoryMock.Verify(r => r.CreateAsync(It.IsAny<Alumno>()), Times.Once);
}
```

---

## Reglas importantes

1. **Arrange / Act / Assert** — siempre los 3 bloques con comentario
2. **Un Assert por test** — si necesitas verificar varias cosas, divide el test
3. **Nombres descriptivos** — deben leerse como documentación
4. **Nunca pruebas el Repository** — es una dependencia, se mockea
5. **FluentAssertions** para aserciones más legibles (`Should().Be()`, `Should().NotBeNull()`)
6. **Theory + InlineData** para múltiples escenarios del mismo método

---

## Checklist antes de marcar las pruebas como terminadas

- [ ] Caso feliz cubierto
- [ ] Caso vacío / no encontrado cubierto
- [ ] Caso de error / excepción cubierto
- [ ] Nomenclatura `Metodo_Condicion_Resultado`
- [ ] Arrange / Act / Assert claramente separados
- [ ] Mocks verificados cuando aplica (Times.Once, Times.Never)
- [ ] Todos los tests pasan en verde
