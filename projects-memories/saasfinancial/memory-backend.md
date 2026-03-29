# memory-backend — SaaSFinancial

## Endpoints implementados

### Auth
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | /api/v1/auth/register | Registrar usuario nativo | No |
| POST | /api/v1/auth/login | Login con email + SHA-256 password | No |
| POST | /api/v1/auth/refresh | Refresh token rotation | No |
| GET | /api/v1/auth/me | Perfil del usuario autenticado | JWT |
| PUT | /api/v1/auth/profile | Actualizar perfil | JWT |
| POST | /api/v1/auth/password-reset/request | Solicitar link de recuperación | No |
| POST | /api/v1/auth/password-reset/confirm | Confirmar nueva contraseña con token | No |

## Decisiones tomadas
- Patrón CQRS basado en semov_backend (`/home/seki/Documentos/Proyectos/semov_backend`)
- `IStorageService` para abstracción de storage (local / Supabase) — implementado
- `IEmailService` para abstracción de correos (Resend) — implementado
- `ICategorySeedService` para seed de categorías base al registrar usuario — implementado
- No poner lógica de negocio en controllers — solo dispatch al mediator
- Interfaces ubicadas en `Library.Source.V1.Infrastructure.Contract` (evita dependencia circular: Infrastructure no referencia Domain)
- Auto-registro de servicios via `[ScopedRegistration]` attribute (reflection sobre assembly "Infrastructure")
- Servicios con interfaz registrados explícitamente en `ConfigureServicePattern`

## HU-000 — Completado (2026-03-28)

### Items implementados

**1. IStorageService + LocalStorageService**
- Interfaz: `Library/Source/V1/Infrastructure/Contract/IStorageService.cs`
- Implementación: `Infrastructure/Source/V1/Service/Storage/LocalStorageService.cs`
- Config: `Storage:LocalPath` (default: `wwwroot/uploads`), `Storage:BaseUrl` (default: `http://localhost:5000`)
- Retorna URL pública del archivo subido
- En producción: reemplazar por `SupabaseStorageService`

**2. IEmailService + ResendEmailService**
- Interfaz: `Library/Source/V1/Infrastructure/Contract/IEmailService.cs`
- Implementación: `Infrastructure/Source/V1/Service/Email/ResendEmailService.cs`
- Config: `Resend:ApiKey` (en secrets/appsettings.Development), `Resend:From` (default: `noreply@mifinanza.app`)
- Usa `IHttpClientFactory` con cliente nombrado "ResendClient"
- HTTP directo a `https://api.resend.com/emails`

**3. Rate Limiting en auth**
- Policy `"auth"`: 10 req/min por IP, FixedWindow, sin queue
- Configurado en `ApplicationService.ConfigureRateLimiting()`
- Aplicado en `AuthController` con `[EnableRateLimiting("auth")]`
- Respuesta 429: `{"data": null, "message": "Demasiadas solicitudes. Intente más tarde."}`
- `app.UseRateLimiter()` en Program.cs (antes de middleware de excepciones)

**4. HTTPS Redirect**
- `app.UseHttpsRedirection()` solo activo en producción (`app.Environment.IsProduction()`)

**5. CategorySeedService**
- Interfaz: `Library/Source/V1/Infrastructure/Contract/ICategorySeedService.cs`
- Implementación: `Infrastructure/Source/V1/Service/Category/Seed/CategorySeedService.cs`
- Método: `SeedAsync(Guid profileId)` — crea 10 categorías (5 income + 5 expense)
- **Income**: Salario, Freelance, Inversión, Préstamo, Otros
- **Expense**: Alimentación, Renta, Hipoteca, Electricidad, Internet
- Se debe invocar desde el handler de registro (HU-002) después de crear el perfil

## HU-001 — Completado (2026-03-28)

### Items implementados

**1. POST /api/v1/auth/login**
- Valida `AuthProvider == "native"` → 401 "Esta cuenta usa Google. Inicia sesión con Google."
- Soft-deleted → 401 "Credenciales inválidas" (sin revelar existencia)
- `BCrypt.Verify(sha256Hash, storedHash)` — frontend envía SHA-256 hex
- Genera JWT (30min) + refresh token (64 bytes aleatorios, SHA-256 hasheado en BD)
- Response: `{ accessToken, refreshToken, expiresIn: 1800, user: { id, email, fullName, avatarUrl, currency, theme, onboardingCompleted, authProvider, ... } }`

**2. POST /api/v1/auth/refresh**
- Recibe raw refresh token (64 bytes base64)
- Busca en BD por SHA-256(rawToken) en columna `refresh_token_hash`
- Verifica que no esté expirado (`refresh_token_expires_at`)
- Token rotation: genera nuevo access + refresh, invalida el anterior
- Response: `{ accessToken, refreshToken, expiresIn: 1800 }`

**3. GET /api/v1/auth/me**
- Ya existía, utiliza `IHttpContext.GetUserId()` del JWT
- Response: `{ id, email, fullName, avatarUrl, currency, theme, onboardingCompleted, authProvider, createdAt, updatedAt }`

### Estructura JWT
- Claim: `ClaimTypes.NameIdentifier` = profile GUID
- Expiración: 30 minutos (1800 segundos) — `BearerTokenListener.AccessTokenExpiresInSeconds`
- Algoritmo: HmacSha256
- Issuer = Audience = `"MiFinanzaAPI"` (de config)

### Refresh token en BD
**Decisión:** columnas en tabla `profiles` (no tabla separada)
- `refresh_token_hash` varchar(255) — SHA-256 hex del token raw
- `refresh_token_expires_at` timestamp — 30 días desde emisión
- Migración: `20260328214348_AddRefreshToken`
- Razón: SaaS single-device, no se necesita multi-sesión en esta fase

### Notas para el frontend (campos exactos del response de login)
```json
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string (base64, 64 bytes)",
    "expiresIn": 1800,
    "user": {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "avatarUrl": "string|null",
      "currency": "MXN",
      "theme": "dark",
      "onboardingCompleted": false,
      "authProvider": "native",
      "notifyOnMovement": true,
      "notifyOnReport": false,
      "notifyMonthlyBalance": false,
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  },
  "message": "Sesión iniciada correctamente"
}
```

## HU-002 — Completado (2026-03-28)

### Items implementados

**POST /api/v1/auth/register — HTTP 201 Created**
- Request: `{ email, password (SHA-256 hex 64 chars), fullName, currency? }`
- Verifica email único incluye soft-deleted (`IgnoreQueryFilters()`) → 409 si duplicado
- Password: valida exactamente 64 chars → `BCrypt.HashPassword(sha256Hash)` en BD
- Crea ProfileEntity con: email lowercase+trim, fullName trim, currency (default "MXN"), authProvider="native", theme="dark", onboardingCompleted=false, notify flags según defaults
- Genera JWT (30min) + refresh token (rotation, SHA-256 hasheado en BD, 30 días)
- Llama `await categorySeedService.SeedAsync(profile.Id)` — 10 categorías base
- Retorna LoginModel (mismo shape que /login): `{ accessToken, refreshToken, expiresIn: 1800, user: {...} }`
- Monedas soportadas: MXN, USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, BRL

**Decisión sobre validación de contraseña en backend:**
El frontend envía el password ya hasheado con SHA-256 (64 chars hex). Validar fortaleza (mayúsculas, números, caracteres especiales) contra el hash SHA-256 no tiene sentido — el hash siempre sería un string hexadecimal. Por tanto:
- **La validación de fortaleza ocurre exclusivamente en el frontend** (antes de hacer SHA-256)
- **El backend valida solo** que el string recibido tenga exactamente 64 chars (confirma que es un SHA-256 hex válido)
- Esto es pragmático, consistente con el flujo de login existente, y evita enviar el password raw al backend

**Cambio en BaseController:**
- `_mediator` promovido de `private` a `protected` para permitir respuestas con status codes distintos de 200 desde subclases (requerido por el 201 de register)

## HU-003 — Completado (2026-03-28)

### Items implementados

**POST /api/v1/auth/password-reset/request**
- Body: `{ email: string }`
- Respuesta siempre 200 con mensaje genérico (no revela existencia del email)
- Solo genera token para cuentas nativas (`authProvider == "native"`)
- Token: 32 bytes aleatorios → hex string, hasheado con SHA-256 en BD
- Expiración: 15 minutos desde creación
- Invalida tokens previos activos del mismo perfil antes de crear uno nuevo
- Envía email HTML vía `IEmailService` con link `{FrontendUrl}/reset-password?token={rawToken}`
- `FrontendUrl` desde config: `AppSettings:FrontendUrl` (default: `http://localhost:5173`)
- Response: `{ "data": null, "message": "Si el correo está registrado, recibirás un enlace en breve" }`

**POST /api/v1/auth/password-reset/confirm**
- Body: `{ token: string, newPassword: string (SHA-256 hex 64 chars) }`
- Busca token válido (no usado, no expirado) por SHA-256(rawToken)
- Si token inválido/expirado: lanza `AppException.ValidationException` → 400
- Al confirmar: actualiza `password_hash` con BCrypt, invalida refresh token (null)
- Marca `used_at = now()` en el token
- Response: `{ "data": null, "message": "Contraseña actualizada correctamente" }`

### Nueva excepción
- `AppException.ValidationException(string message)` → HTTP 400 en ExceptionMiddleware
- Usada en lugar de `NullableException` para mensajes de validación de negocio legibles

### Archivos creados
- `Domain/Source/V1/Scheme/Auth/PasswordResetRequest/` — 3 archivos (Request, Command, Handler)
- `Domain/Source/V1/Scheme/Auth/PasswordResetConfirm/` — 3 archivos (Request, Command, Handler)
- `Infrastructure/Source/V1/Service/Auth/PasswordResetRequestService.cs`
- `Infrastructure/Source/V1/Service/Auth/PasswordResetConfirmService.cs`

### Archivos modificados
- `Application/Source/V1/Controller/Auth/AuthController.cs` — 2 endpoints nuevos
- `Application/appsettings.json` — `AppSettings:FrontendUrl`
- `Library/Source/V1/Application/AppException.cs` — `ValidationException`
- `Library/Source/V1/Application/ExceptionMiddleware.cs` — manejo `ValidationException` → 400

### Notas para el frontend (response de register)
```json
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string (base64, 64 bytes)",
    "expiresIn": 1800,
    "user": {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "avatarUrl": null,
      "currency": "MXN",
      "theme": "dark",
      "onboardingCompleted": false,
      "authProvider": "native"
    }
  },
  "message": "Cuenta creada correctamente"
}
```
