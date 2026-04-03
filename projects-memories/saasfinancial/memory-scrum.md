# Memoria: Scrum — SaaSFinancial (EFinance)

_Última actualización: 2026-04-02_

---

## Sprint actual: HU-006 — Sección de Perfil

**Estado:** Por iniciar
**Estimación:** 3 puntos
**Rama sugerida:** `feat-HU006` (desde `dev`)
**Commit prefix:** `SAASF{n} | `

---

## Plan de implementación detallado

### Backend

#### Lo que YA existe (no tocar)

| Artefacto | Ruta | Estado |
|---|---|---|
| `PUT /api/v1/auth/profile` | `AuthController.cs` | FUNCIONAL |
| `UpdateProfileRequest.cs` | `Domain/.../Auth/UpdateProfile/` | Tiene: fullName, avatarUrl, currency, theme, notifyOnMovement, notifyOnReport, notifyMonthlyBalance, onboardingCompleted |
| `UpdateProfileCommand.cs` | `Domain/.../Auth/UpdateProfile/` | FUNCIONAL |
| `UpdateProfileCommandHandler.cs` | `Domain/.../Auth/UpdateProfile/` | FUNCIONAL |
| `UpdateProfileService.cs` | `Infrastructure/.../Auth/` | FUNCIONAL — actualiza todos los campos del perfil |
| `GET /api/v1/auth/me` | `AuthController.cs` | FUNCIONAL |

#### Lo que hay que CREAR en backend

**`POST /api/v1/auth/change-password`**

Archivos a crear (patrón CQRS):
```
Domain/Source/V1/Scheme/Auth/ChangePassword/
  ChangePasswordRequest.cs
  ChangePasswordCommand.cs
  ChangePasswordCommandHandler.cs

Infrastructure/Source/V1/Service/Auth/
  ChangePasswordService.cs
```

Archivo a modificar:
- `Application/Source/V1/Controller/Auth/AuthController.cs` — agregar endpoint

Request body:
```json
{
  "currentPassword": "string (SHA-256 hex, 64 chars)",
  "newPassword": "string (SHA-256 hex, 64 chars)"
}
```

Lógica del servicio:
1. Buscar perfil por userId del JWT
2. Verificar `authProvider == "native"` → 400 "Esta operación no está disponible para cuentas de Google"
3. `BCrypt.Verify(currentPasswordHash, profile.PasswordHash)` → si falla: 400 "La contraseña actual es incorrecta"
4. Verificar que `newPassword != currentPassword` (comparar hashes) → 400 "La nueva contraseña no puede ser igual a la actual"
5. `profile.PasswordHash = BCrypt.HashPassword(newPasswordHash)`
6. Invalidar refresh token (`profile.RefreshTokenHash = null`, `profile.RefreshTokenExpiresAt = null`)
7. `profile.UpdatedAt = DateTime.UtcNow`
8. Response: `{ "data": null, "message": "Contraseña actualizada correctamente" }`

Notas:
- Usar `AppException.ValidationException` para los 400 con mensajes legibles
- Aplicar `[EnableRateLimiting("auth")]` al endpoint
- NO retornar nuevo token — el usuario sigue logueado con su access token actual (que expira en 30 min)
- El refresh token se invalida como medida de seguridad (próxima renovación fallará y pedirá login)

---

### Frontend

#### Lo que YA existe (reutilizar)

| Artefacto | Ruta | Qué aporta |
|---|---|---|
| `authStore.updateProfile(data)` | `stores/auth.ts` | Llama `PUT /api/v1/auth/profile`, actualiza state |
| `authStore.user` | `stores/auth.ts` | fullName, email, avatarUrl, currency, theme, authProvider, notifyOnMovement, notifyOnReport, notifyMonthlyBalance |
| `UserProfile` interface | `stores/auth.ts` | Falta: notifyOnMovement, notifyOnReport, notifyMonthlyBalance (ver nota abajo) |
| `useTheme` composable | `src/composables/` | Toggle de tema |
| Layout sidebar (App.vue) | `src/App.vue` | Avatar con iniciales en footer del sidebar |
| Sistema de diseño | `src/style.css` | Tokens CSS, dark-navy, indigo accent |

**Nota crítica sobre `UserProfile` interface:**
El store tiene `updateProfile` que acepta los campos de notificaciones, pero la interface `UserProfile` en `auth.ts` NO los incluye. Hay que agregar a la interface:
```typescript
notifyOnMovement?: boolean
notifyOnReport?: boolean
notifyMonthlyBalance?: boolean
```
Y actualizar `_mapUser()` para leer estos campos del response del backend.

#### Lo que hay que CREAR en frontend

**1. `ProfileView.vue`** — `/src/views/ProfileView.vue`

Estructura de la vista (4 secciones como cards):

```
Card 1 — Información personal
  - Avatar (circular, 80px) + botón "Cambiar foto" (si hay IStorageService endpoint)
    Fallback: iniciales del usuario con fondo indigo
  - Campo: Nombre completo (input editable)
  - Campo: Email (texto, no editable, etiqueta "Solo lectura")
  - Campo: Moneda (Select: MXN, USD, EUR, etc.)
  - Etiqueta: tipo de cuenta ("Cuenta nativa" / "Cuenta de Google" con ícono)
  - Fecha de registro (texto, read-only)
  - Botón: "Guardar cambios"

Card 2 — Apariencia
  - Toggle de tema (dark/light) — reutilizar lógica de useTheme
    (Si ya hay toggle en sidebar footer: puede ser un radio/select acá también)

Card 3 — Notificaciones
  - Toggle: "Notificar al registrar un movimiento" (notifyOnMovement)
  - Toggle: "Notificar al generar un reporte" (notifyOnReport)
  - Toggle: "Resumen mensual de balance" (notifyMonthlyBalance)
  - Cada toggle guarda inmediatamente (sin botón separado)

Card 4 — Seguridad
  - Si authProvider === 'native':
    - Campo: Contraseña actual (Password PrimeVue)
    - Campo: Nueva contraseña (Password + indicador de fortaleza)
    - Campo: Confirmar nueva contraseña
    - Botón: "Cambiar contraseña"
  - Si authProvider === 'google':
    - Mensaje informativo con ícono Google
    - "Tu contraseña es administrada por Google."
```

**2. Router — agregar ruta**

En `/src/router/index.ts`:
```typescript
{
  path: '/perfil',
  name: 'perfil',
  component: () => import('@/views/ProfileView.vue'),
  meta: { requiresAuth: true }
}
```

**3. App.vue — navegación desde sidebar footer**

En el footer del sidebar (donde ya está el avatar con iniciales), agregar `router-link` o click handler que navegue a `/perfil`.

El ítem "Perfil" puede ir en `navItems` del sidebar o directamente como acción del avatar en el footer.

**4. `useProfile.ts` composable** (opcional pero recomendado)

Encapsula la lógica de:
- Estado del formulario (campos reactivos inicializados desde `authStore.user`)
- `savePersonalInfo()` — llama `authStore.updateProfile({fullName, currency})`
- `toggleNotification(field, value)` — llama `authStore.updateProfile({[field]: value})`
- `changePassword(currentPassword, newPassword)` — hashea con SHA-256, POST `/api/v1/auth/change-password`
- Manejo de errores y estados de loading por sección

---

## Orden de implementación sugerido

### Fase 1 — Backend (1-2h)
1. Crear `ChangePasswordRequest.cs`, `ChangePasswordCommand.cs`, `ChangePasswordCommandHandler.cs`
2. Crear `ChangePasswordService.cs`
3. Agregar endpoint en `AuthController.cs`
4. Probar con Swagger

### Fase 2 — Frontend ajustes previos (30min)
1. Actualizar `UserProfile` interface en `auth.ts` — agregar notifyOnMovement, notifyOnReport, notifyMonthlyBalance
2. Actualizar `_mapUser()` para leer esos campos del response
3. Agregar ruta `/perfil` en router

### Fase 3 — Vista de perfil (2-3h)
1. Crear `ProfileView.vue` con las 4 secciones
2. Crear `useProfile.ts` composable
3. Conectar con `authStore.updateProfile()` y el nuevo endpoint de cambio de contraseña
4. Agregar navegación desde sidebar footer

### Fase 4 — Polish y tests manuales (30min)
1. Verificar que los cambios se reflejan en el topbar/sidebar (nombre, avatar)
2. Verificar flujo Google (no muestra cambio de contraseña)
3. Verificar toggle de tema desde perfil
4. Verificar toasts de éxito/error

---

## Checklist de definition of done

- [ ] Backend: `POST /api/v1/auth/change-password` creado y funcional
- [ ] Backend: rate limiting aplicado al nuevo endpoint
- [ ] Frontend: `UserProfile` interface actualizada con campos de notificaciones
- [ ] Frontend: `_mapUser()` actualizado
- [ ] Frontend: `ProfileView.vue` creada con las 4 secciones
- [ ] Frontend: ruta `/perfil` en router
- [ ] Frontend: navegación desde sidebar footer al perfil
- [ ] Frontend: cambio de contraseña solo visible para usuarios nativos
- [ ] Frontend: toggles de notificaciones guardan inmediatamente
- [ ] Frontend: toast feedback en todas las operaciones
- [ ] Build sin errores TypeScript
- [ ] Commit: `SAASF{n} | HU-006 Sección de Perfil`

---

## Notas de arquitectura

### Por qué NO separar avatar upload en esta HU
`IStorageService` existe pero no hay endpoint HTTP de upload expuesto. Agregar upload de avatar requiere:
- Nuevo endpoint `POST /api/v1/storage/upload` con multipart/form-data
- Lógica de validación de tipo/tamaño de imagen
Esto infla la HU. Opciones para HU-006:
- **Opción A (recomendada):** campo `avatarUrl` como input de texto (URL directa). Simple, funcional.
- **Opción B:** crear el endpoint de upload en la misma HU si hay tiempo.

### Consistencia de tema
Si el toggle de tema ya existe en el sidebar footer (en `App.vue`), la sección "Apariencia" del perfil puede duplicar esa funcionalidad. Esto es aceptable en UX — el usuario puede cambiar el tema desde ambos lugares.
