# Memoria: PO — SaaSFinancial (EFinance)

_Última actualización: 2026-04-02_

---

## Backlog priorizado

| HU | Título | Estado | Sprint |
|---|---|---|---|
| HU-000 | Setup infraestructura (storage, email, rate limiting, HTTPS) | COMPLETADO | — |
| HU-001 | Login nativo + refresh token | COMPLETADO | — |
| HU-002 | Registro nativo | COMPLETADO | — |
| HU-003 | Recuperación de contraseña | COMPLETADO | — |
| HU-004 | Onboarding wizard | COMPLETADO | — |
| HU-005 | Accounts CRUD | COMPLETADO | — |
| HU-006 | Sección de Perfil | DEFINIDO | Siguiente |
| HU-007 | Transactions — Gastos | PENDIENTE | — |
| HU-008 | Transactions — Ingresos | PENDIENTE | — |
| HU-009 | Transfers entre cuentas | PENDIENTE | — |
| HU-010 | Dashboard con resumen financiero | PENDIENTE | — |
| HU-011 | Reportes y gráficas | PENDIENTE | — |

---

## HU-006: Sección de Perfil

**ID:** HU-006
**Prioridad:** Alta
**Estimación:** 3 puntos de historia
**Sprint:** Siguiente al cierre de HU-005

### Historia de usuario

> Como usuario de EFinance, quiero una vista de perfil donde pueda ver y editar mis datos personales y preferencias de la aplicación, para personalizar mi experiencia y mantener mi información actualizada.

### Criterios de aceptación

**CA-1 — Ver el perfil**
- El usuario puede acceder a la vista `/perfil` desde el sidebar o desde el avatar en el footer del sidebar.
- La vista muestra: avatar (imagen si existe, iniciales si no), nombre completo, email (no editable), tipo de cuenta (nativo vs Google — etiqueta visual), fecha de registro.

**CA-2 — Editar datos básicos**
- El usuario puede editar: `fullName`, `currency`, `theme`.
- El campo `email` es de solo lectura (mostrado como texto, no input).
- El campo `avatarUrl` es editable: el usuario puede subir una foto de perfil. Al subir, se llama `POST /api/v1/storage/upload` (o el mecanismo existente de `IStorageService`) y se guarda la URL devuelta en el perfil.
- Los cambios se guardan vía `PUT /api/v1/auth/profile`.
- Al guardar exitosamente: toast "Perfil actualizado" y el store de auth refleja los cambios.

**CA-3 — Preferencias de notificaciones**
- La sección "Notificaciones" muestra tres toggles:
  - `notifyOnMovement`: "Notificar al registrar un movimiento"
  - `notifyOnReport`: "Notificar al generar un reporte"
  - `notifyMonthlyBalance`: "Resumen mensual de balance"
- Cada toggle guarda inmediatamente vía `PUT /api/v1/auth/profile` con el campo correspondiente.

**CA-4 — Cambio de contraseña (solo usuarios nativos)**
- La sección "Seguridad" muestra el formulario de cambio de contraseña únicamente si `authProvider === 'native'`.
- Para usuarios Google (`authProvider === 'google'`): mostrar mensaje informativo "Tu contraseña es administrada por Google. No puedes cambiarla desde aquí."
- El formulario de cambio de contraseña requiere: `currentPassword`, `newPassword`, `confirmNewPassword`.
- Validaciones frontend: `newPassword` mismo esquema que registro (min 10, upper, lower, número, especial).
- Se hashea `currentPassword` y `newPassword` con SHA-256 antes de enviar al backend.
- Endpoint: `POST /api/v1/auth/change-password` (debe crearse en backend).
- Errores manejados: contraseña actual incorrecta (400 con mensaje específico), contraseña nueva igual a la actual (400).

**CA-5 — Navegación**
- El ítem "Perfil" aparece en el footer del sidebar (junto al toggle de tema y el avatar).
- Al hacer click en el avatar/iniciales del footer del sidebar, navega a `/perfil`.
- La ruta `/perfil` requiere auth (`meta.requiresAuth: true`).

**CA-6 — Diseño y UX**
- La vista sigue el sistema de diseño dark-navy + indigo accent.
- Secciones separadas visualmente con cards: "Información personal", "Preferencias", "Notificaciones", "Seguridad".
- Botón "Guardar cambios" por sección (no global) excepto los toggles de notificaciones que guardan al cambiar.
- Feedback visual: loading spinner en botones mientras se guarda, toast PrimeVue al éxito o error.

---

## Decisiones de producto

### ¿Por qué cambio de contraseña separado del `PUT /auth/profile`?
El endpoint `PUT /api/v1/auth/profile` existe y funciona para campos de perfil. El cambio de contraseña requiere verificar la contraseña actual antes de cambiarla — es una operación de seguridad diferente que merece su propio endpoint con su propia lógica de validación.

### ¿Por qué no editar email?
El email es el identificador único del usuario. Permitir cambiarlo requiere re-verificación (enviar email de confirmación al nuevo correo, lógica de unicidad, invalidar sesiones). Se deja fuera del MVP para evitar complejidad — se puede añadir en fase 2.

### Avatar
`IStorageService` ya está implementado. El frontend puede hacer upload directamente via un endpoint de storage y guardar la URL resultante en el perfil. Si no hay endpoint de upload aún, el avatar se omite en la primera iteración (campo `avatarUrl` en el form puede ser un input de texto con URL directa como fallback).

---

## Notas para el equipo

- El backend ya tiene `PUT /api/v1/auth/profile` y `UpdateProfileService` completamente funcional para todos los campos excepto contraseña.
- El frontend ya tiene `authStore.updateProfile(data)` implementado.
- Lo único que falta crear en backend es `POST /api/v1/auth/change-password`.
- En frontend: crear vista `ProfileView.vue`, agregar ruta `/perfil`, agregar navegación desde sidebar footer.
