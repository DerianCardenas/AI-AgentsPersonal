# memory-frontend — EFinance (SaaSFinancial)

## Estado HU-000 — Completado (2026-03-28)

### Item 1: Configuración PrimeVue — VERIFICADO (sin cambios)

Estado: ya estaba correctamente configurado en `/src/main.ts`.

```typescript
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  },
  locale: { /* español completo */ }
})
```

Nota: `cssLayer` usa la forma objeto en lugar de `false`. Esto es válido y garantiza que las utilities de Tailwind puedan sobrescribir estilos de PrimeVue. No se modificó — funciona correctamente.

Servicios globales registrados: `ToastService`, `ConfirmationService`, directiva `v-tooltip`.

---

### Item 2: Variables CSS de tema — VERIFICADO (sin cambios)

Estado: completamente implementado en `/src/style.css` (1249 líneas).

Tokens disponibles en clases `.dark` y `.light`:

| Token | Propósito | Dark value |
|---|---|---|
| `--color-primary` | Indigo accent | `99 102 241` |
| `--color-primary-hover` | Hover accent | `79 70 229` |
| `--color-success/error/warning/info` | Status colors | ✓ |
| `--color-income/expense/balance` | Financial colors | ✓ |
| `--bg-primary/secondary/tertiary/elevated/overlay` | Backgrounds dark-navy | `8 10 18` base |
| `--text-primary/secondary/tertiary/inverse` | Text layers | ✓ |
| `--border-primary/secondary/focus` | Borders | ✓ |
| `--input-bg/border/focus-ring` | Form inputs | ✓ |
| `--shadow-sm/md/lg/xl/card-shadow` | Shadows (CSS values) | ✓ |
| `--sidebar-bg/border/width/collapsed-width` | Sidebar sizing | ✓ |

Nota: Los tokens usan `--bg-primary` en vez de `--color-bg-primary` (diferencia vs spec). Los nombres reales son los listados arriba. Formato RGB sin `rgb()` — se usan como `rgb(var(--bg-primary))`.

Fuentes: Inter (primaria) + JetBrains Mono (código/números).

El archivo incluye overrides completos de PrimeVue para: inputs, selects, multiselect, botones, dialogs, confirmdialog, toasts, datatable, paginator, calendar, menus, avatar, badge, card, checkbox.

---

### Item 3: Layout base — VERIFICADO (sin cambios)

Estado: implementado directamente en `App.vue` (no como componente separado).

Archivo: `/src/App.vue`

Características verificadas:
- **Sidebar fijo colapsable (desktop):** clase `sidebar-collapsed` toggleada por `sidebarCollapsed` ref — persiste en `localStorage` con clave `sidebar-collapsed`
- **Sidebar overlay (móvil):** clase `sidebar-open` + backdrop `.sidebar-backdrop` para pantallas ≤ 1024px
- **Topbar:** `header.app-topbar` con área izquierda (toggle + título de página) y derecha (logout). Altura 64px fija sticky.
- **RouterView:** en `main.app-content` como slot principal
- **Tema:** clase `.dark` o `.light` en el wrapper raíz — controlada por composable `useTheme`
- **Rutas auth (login/register):** sin sidebar ni topbar — solo RouterView sobre `--bg-primary`

Navegación del sidebar (navItems):
- Dashboard → `/dashboard`
- Cuentas → `/cuentas`
- Gastos → `/gastos`
- Ingresos → `/ingresos`
- Suscripciones → `/suscripciones`
- Reportes → `/reportes`

Footer del sidebar: toggle de tema + avatar con iniciales del usuario.

Estructura del router (`/src/router/index.ts`): rutas planas con `meta.requiresAuth` / `meta.requiresGuest`. No usa AppLayout como wrapper anidado — la lógica de layout está en App.vue mediante `showMainLayout` computed.

---

### Build

`npm run build` → sin errores TypeScript. 501 módulos transformados. Generado en 3.69s.

---

## Vistas implementadas

| Vista | Archivo | Estado |
|---|---|---|
| Login | `LoginViewModern.vue` | Existe |
| Registro | `RegisterViewModern.vue` | Existe |
| Dashboard | `DashboardViewNew.vue` | Existe |
| Gastos | `GastosView.vue` | Existe |
| Ingresos | `IngresosView.vue` | Existe |
| Cuentas | `CuentasView.vue` | Existe |
| Suscripciones | `SuscripcionesView.vue` | Existe |
| Reportes | `ReportesView.vue` | Existe |

---

## Decisiones tomadas

- PrimeVue: `darkModeSelector: '.dark'` — correcto
- `cssLayer` en formato objeto (no `false`) — compatible y funcional, no modificar
- Sistema de diseño: dark-navy + indigo `#6366f1`, tokens CSS como variables RGB
- Layout: sidebar en App.vue (no componente separado AppLayout.vue)
- Sin glassmorphism — cards sólidas con border + box-shadow
- Rama activa: `feat-HU000` (creada desde `dev`)
- Stores directorio: solo `auth.ts` en `/src/stores/`
- Composables detectados: `useTheme`, `useSessionMonitor`

---

## Cambios aplicados — 2026-03-28

### SAASF04 — Rename MiFinanza → EFinance

El nombre de la aplicación fue cambiado de "MiFinanza" a "EFinance" en todos los archivos.

Archivos modificados:
- `src/App.vue` — sidebar logo text + fallback del título de página
- `src/views/LoginViewModern.vue` — subtitle del login
- `src/views/RegisterViewModern.vue` — h1 del encabezado de registro
- `src/components/AppHeaderPrime.vue` — h1 del header
- `README.md` — título del repo
- `.env` — `VITE_APP_NAME`
- `.env.production` — `VITE_APP_NAME`
- `wrangler.json` — `VITE_APP_NAME`
- `index.html` — `<title>`

Las referencias en `database/*.sql` y `PROJECT.md` son documentación/SQL y no afectan la UI — se dejaron sin cambio.

---

### SAASF05 — Fix ícono contraseña + mejoras diseño formularios auth

#### Bug fix — toggle visibility en `<Password>` de PrimeVue 4

PrimeVue 4 renderiza el botón de toggle como un `<button>` posicionado dentro del wrapper `.p-password`. El problema era que el botón heredaba `padding-bottom` diferente al padding-top, descentrándolo verticalmente.

**Fix aplicado en ambas vistas:**
```css
:deep(.p-password button) {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

El SVG interior se neutraliza con `pointer-events: none` para evitar que el click no registre.

#### Mejoras en LoginViewModern.vue

- Inputs con `height: 44px` uniforme y padding consistente (`0 12px` para email, `0 42px 0 12px` para password)
- Focus ring con color accent: `box-shadow: 0 0 0 3px rgba(var(--color-primary) / 0.18)`
- Border accent en focus: `border-color: rgb(var(--color-primary))`
- Mensajes de error con ícono `pi pi-exclamation-circle` + texto en flex row
- `.field-error` usa `display: flex; align-items: center; gap: 4px`

#### Notas para futuros agentes

- **PrimeVue 4 Password**: usa SVG icons (no font icons) para el toggle. Selector correcto: `:deep(.p-password button svg)` para colorear el ícono.
- **LoginViewModern.vue** sigue el sistema de diseño correcto: dark-navy + tokens CSS + cards sólidas.
- El componente `AppHeaderPrime.vue` no está siendo usado en el layout actual (el layout está en `App.vue`). Se mantiene por compatibilidad.

---

### SAASF06 — Rediseño RegisterViewModern.vue para consistencia visual con LoginView (2026-03-28)

#### Cambios aplicados

`RegisterViewModern.vue` fue completamente rediseñado para ser visualmente consistente con `LoginViewModern.vue`.

**Eliminado (glassmorphism / inconsistencias):**
- `backdrop-blur-xl`, `bg-white/10`, `border border-white/20` — glassmorphism eliminado
- Uso de `<Card>` de PrimeVue con `backdrop-filter: blur(24px)` y `background: rgba(255,255,255,0.12)`
- Fondo Tailwind: `bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900`
- Decoraciones con `blur-3xl`, `animate-pulse`, `animate-bounce` y `FloatingParticles`
- `<Button>` de PrimeVue con clases emerald — reemplazado por `<button>` nativo igual que login
- `<Message>` de PrimeVue para errores — reemplazado por `.field-error` con `pi-exclamation-circle`
- Colores emerald (`#10b981`) reemplazados por accent indigo `rgb(var(--color-primary))`
- Import de `FloatingParticles`, `Card`, `Button`, `Message` — removidos

**Implementado (sistema de diseño dark-navy):**
- Fondo: `rgb(var(--bg-primary))` — mismo que login
- Card: clase `.card` del sistema (sólida, sin blur) con `.register-card-inner { padding: 40px 36px }`
- Decoración de fondo: blobs con `filter: blur(80px); opacity: 0.08` — idéntica al login
- Logo icon: mismo estilo (56x56px, gradiente indigo, `box-shadow` con accent)
- Inputs `height: 44px` con `border: 1.5px solid rgb(var(--border-primary))`
- Focus ring: `box-shadow: 0 0 0 3px rgba(var(--color-primary) / 0.18)`
- Toggle ícono contraseña: `position: absolute; top: 50%; transform: translateY(-50%)` — vertically centered
- Dropdown: mismo estilo que inputs (height 44px, border accent en focus, panel oscuro)
- Checkbox: borde y fondo con tokens CSS, highlight en `rgb(var(--color-primary))`
- Botón submit: `<button>` nativo idéntico al login (indigo, spinner CSS, hover lift)
- Mensajes de error: `.field-error` con `pi pi-exclamation-circle` — igual al login
- Términos y condiciones: enlace `rgb(var(--color-primary))` sin underline decorativo extra
- Footer "¿Ya tienes cuenta?": mismo pattern que login footer
- Password strength meter: colores via tokens (`--color-error`, `--color-warning`, `--color-income`)

**Lógica Vue/TS mantenida sin cambios:**
- Composable `useRegistration(router)` — sin modificar
- Todos los campos del formulario: fullName, email, password, confirmPassword, currency, language, acceptTerms
- Validaciones y `handleRegister` — sin modificar
- Props del componente `<Password>`: feedback, weakLabel, mediumLabel, strongLabel, regexes de fuerza

#### Deuda técnica resuelta

- ~~RegisterViewModern.vue usa glassmorphism inconsistente con el sistema de diseño~~ — **RESUELTO en SAASF06**

---

---

## Estado HU-001 — Completado (2026-03-28) | commit SAASF08

### Auth Store (`/src/stores/auth.ts`)

Reescrito completamente. Nuevo contrato alineado al backend HU-001.

**Estado:**
```typescript
accessToken: Ref<string | null>   // localStorage key: 'accessToken'
refreshToken: Ref<string | null>  // localStorage key: 'refreshToken'
user: Ref<UserProfile | null>
isLoading: Ref<boolean>
error: Ref<string | null>
_initialized: Ref<boolean>        // flag de inicialización única
```

**UserProfile interface:**
```typescript
interface UserProfile {
  id, email, fullName, avatarUrl, currency,
  theme: 'dark' | 'light', onboardingCompleted,
  authProvider?, createdAt?
}
```

**Getters:**
- `isAuthenticated`: `!!accessToken && !!user`
- `isOnboarded`: `user?.onboardingCompleted ?? false`
- `userInitials`: primeras letras del nombre (max 2)

**Acciones implementadas:**
- `login(email, password)` — hashea SHA-256 internamente antes de POST /api/v1/auth/login
- `register(data)` — delega a AuthService legacy (mapea old response shape al nuevo UserProfile)
- `logout()` — limpia state + localStorage, redirige a /login con `router.push`
- `refreshAccessToken()` — POST /api/v1/auth/refresh con refreshToken
- `fetchMe()` — GET /api/v1/auth/me, actualiza user en state
- `initializeAuth()` — async, idempotente, lee localStorage y llama fetchMe() para validar

**Nota:** `register()` mantiene compatibilidad con `useRegistration.ts` que necesita `authStore.register({email, full_name, password, ...})`.

---

### Router guards (`/src/router/index.ts`)

Guard `router.beforeEach` es ahora **async**:
```typescript
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  if (!authStore._initialized) await authStore.initializeAuth()
  // requiresAuth && !isAuthenticated → /login
  // requiresGuest && isAuthenticated → /dashboard
})
```
Import de `useAuthStore` movido al top del archivo (eliminado import al final que existía antes).

---

### Interceptor Axios (`/src/plugins/axios.ts`)

Reescrito con cola de refresh para evitar múltiples refreshes simultáneos.

**Request interceptor:**
- Lee `localStorage.getItem('accessToken')` directamente (evita circular import en módulo init)
- Agrega `Authorization: Bearer {token}` a cada request

**Response interceptor — lógica 401:**
- Si 401 en endpoint de auth (`/auth/login`, `/auth/register`, `/auth/refresh`) → no intenta refresh
- Si 401 en ruta protegida y `!request._retry`:
  - Si `isRefreshing = true` → encola el request con `pendingQueue`
  - Si `isRefreshing = false` → llama `authStore.refreshAccessToken()`, luego drena la cola
  - Si refresh falla → drena cola con error + llama `authStore.logout()`
- Retry del request original con el nuevo token

---

### SHA-256 helper (`/src/utils/crypto.ts`)

Renombrado a `sha256Hex()` (función principal). `hashPassword()` conservado como alias para compatibilidad con `authService.ts`.

---

### LoginViewModern.vue — cambios aplicados

1. Firma de login actualizada: `authStore.login(form.email, form.password)` (no objeto)
2. Muestra `authStore.error` en panel rojo dentro del formulario
3. `onMounted(() => authStore.clearError())` para limpiar errores al montar
4. Botón "Continuar con Google" agregado: `<button disabled title="Próximamente disponible">` con SVG del logo de Google + CSS `.login-google-btn` (opacidad 0.55, cursor not-allowed)
5. Divisor `o` entre el botón principal y el de Google

---

### Archivos actualizados por renombre `full_name` → `fullName`

- `App.vue`: `authStore.user?.fullName`
- `AppHeaderPrime.vue`: `authStore.user?.fullName`
- `composables/useReportes.ts`: `authStore.user?.fullName`
- `composables/useSessionMonitor.ts`: eliminada dependencia de `authUtils` de authService; `getTimeUntilExpiration()` implementada localmente con fallback a 30 min

---

### Build — resultado SAASF08

`npm run build` → 0 errores TypeScript. 495 módulos transformados. 2.98s.

---

---

## Estado HU-002 — Completado (2026-03-28) | commit SAASF10

### Auth Store — acción `register` reescrita

`/src/stores/auth.ts` — la acción `register` fue migrada del patrón legacy (delegaba a `AuthService`) al nuevo contrato del backend.

**Nueva firma:**
```typescript
register(fullName: string, email: string, password: string, currency: string): Promise<void>
```

**Comportamiento:**
- Hashea password con `sha256Hex` antes de POST `/api/v1/auth/register`
- Body: `{ fullName, email, password (SHA-256 hex), currency }`
- Al éxito: `_saveTokens(accessToken, refreshToken)` + `user.value = _mapUser(d.user)` — mismo patrón que `login`
- Redirección: `/onboarding` si `onboardingCompleted = false`, `/dashboard` en caso contrario
- Error 409 → message `'El correo ya está registrado'`
- Error 429 → message rate-limit
- Otros errores → extrae `response.data.message` o usa fallback
- El error se adjunta al objeto Error como `.status` y `.response` para que el composable pueda discriminar

Import de `AuthService` eliminado del store.

---

### useRegistration.ts — migrado a vee-validate + Yup

`/src/composables/useRegistration.ts` completamente reescrito.

**Schema Yup:**
```typescript
fullName: string, required, min(2)
email: string, required, email()
password: string, required, min(10), [A-Z], [a-z], [0-9], [^A-Za-z0-9]
confirmPassword: oneOf([ref('password')])
currency: string, required
acceptTerms: boolean, oneOf([true])
```

**vee-validate setup:**
- `useForm({ validationSchema: schema, initialValues: { currency: 'MXN', acceptTerms: false, ... } })`
- `useField` por campo → `value` + `errorMessage`
- `handleSubmit` de vee-validate como submit handler
- `setFieldError('email', msg)` para 409

**Objeto `form` compatible con template:** getter/setter proxy sobre los `useField.value` refs, mantiene la misma interfaz que tenía el `reactive<RegistrationForm>` anterior para que el template funcione sin cambios en los `v-model`.

**Objeto `errors` compatible con template:** getters sobre `errorMessage` de cada campo (retorna `''` si undefined).

**Password strength (4 niveles, tokens CSS):**
- `passwordStrengthLevel`: `0|1|2|3|4` basado en longitud y condiciones
- `passwordStrengthLabel`: `''|'Débil'|'Media'|'Fuerte'|'Muy fuerte'`
- `passwordStrengthColorVar`: nombre de la CSS variable sin `rgb()`:
  - 1 → `--color-error`, 2 → `--color-warning`, 3/4 → `--color-income`
- `passwordStrengthWidth`: `'{n*25}%'` (no se usa en la vista nueva — se usa el indicador de barras)

**Opciones de moneda expandidas:** MXN, USD, EUR, GBP, CAD, ARS, COP, CLP, PEN, BRL

**Manejo de errores backend:**
- 409 → `setFieldError('email', 'El correo ya está registrado')`
- 429 → `notifyError()` toast
- otros → `notifyError()` toast con el mensaje del error

---

### RegisterViewModern.vue — cambios aplicados (SAASF10)

**Mantenido del SAASF06:** diseño dark-navy, card sólida, blobs de fondo, tokens CSS, PrimeVue overrides.

**Cambios aplicados:**

1. **Imports de script:** agrega `onMounted`, `useAuthStore`; usa nuevos exports del composable (`passwordStrengthLevel`, `passwordStrengthLabel`, `passwordStrengthColorVar`).

2. **`onMounted(() => authStore.clearError())`** — limpia error stale al montar.

3. **Password component:** `feedback="false"` (feedback propio de PrimeVue deshabilitado — usamos indicador custom).

4. **Indicador de fortaleza custom (4 barras):** debajo del campo password, visible solo si hay texto. 4 divs `.strength-bar` coloreados con `background: rgb(var(--color-error/warning/income))` según nivel. Label a la derecha con el mismo token de color.

5. **Checklist de requisitos:** 5 ítems (`length ≥ 10`, minúscula, mayúscula, número, especial). `pi-check req-ok` / `pi-circle req-pending`.

6. **Selector de moneda:** ocupa ancho completo (no grid de 2 columnas con idioma). Campo idioma eliminado del template (no forma parte del contrato del backend). Muestra error Yup si no se selecciona.

7. **Panel error backend:** `<div v-if="authStore.error" class="backend-error">` con ícono `pi-exclamation-triangle`, fondo `rgba(--color-error / 0.1)`, borde `rgba(--color-error / 0.3)`. Aparece arriba del botón submit.

8. **Placeholder contraseña:** `"Mínimo 10 caracteres"` (corregido desde 8).

---

---

## Estado HU-003 — Completado (2026-03-28) | commit SAASF12

### Vistas creadas

**ForgotPasswordView.vue** — ruta `/forgot-password` (`meta.requiresGuest: true`)
- Campo email + botón "Enviar enlace"
- POST `/api/v1/auth/password-reset/request` vía `api` (axios)
- Siempre muestra estado de confirmación al terminar (éxito o error) — no revela si el email existe
- Estado success: icono envelope + mensaje "Revisa tu correo"
- Link "← Volver al inicio de sesión"

**ResetPasswordView.vue** — ruta `/reset-password` (`meta.requiresGuest: true`)
- Lee `token` del query param `?token=` en `onMounted`
- Sin token: muestra estado "Enlace inválido" con botón "Solicitar nuevo enlace" → `/forgot-password`
- Campos: nueva contraseña + confirmar contraseña con `<Password>` de PrimeVue
- Indicador de fortaleza con 4 barras (mismo patrón que registro)
- Checklist de 5 requisitos (longitud, lower, upper, número, especial)
- SHA-256 hasheado antes de POST `/api/v1/auth/password-reset/confirm`
- Al éxito (200): estado success + redirect a `/login` tras 2.5 segundos
- En error (400): panel `backend-error` + botón "Solicitar nuevo enlace"
- Link "← Volver al inicio de sesión"

### Cambio en LoginViewModern.vue
- `<a href="#">¿Olvidaste tu contraseña?</a>` → `<router-link to="/forgot-password">`

### Router (`/src/router/index.ts`)
- Añadidas rutas `forgot-password` y `reset-password` con `meta.requiresGuest: true`

---

## Estado HU-004 — Completado (2026-03-28) | commit SAASF14

### OnboardingView.vue — `/onboarding` (`meta.requiresAuth: true`)

Wizard de 2 pasos + pantalla de completado:
- **Step 1 (Bienvenida):** logo, features del app, botones "Comenzar" y "Omitir por ahora"
- **Step 2 (Crear cuentas):** formulario para añadir cuentas (nombre, tipo, moneda), lista con eliminación, balance siempre $0.00. Tipos: checking, savings, cash, investment, loan
- **Step done:** mensaje de éxito + botón a dashboard

**Omitir:** llama `PUT /api/v1/auth/profile { onboardingCompleted: true }`, guarda `localStorage.setItem('onboarding_skipped', 'true')`, navega a `/dashboard`

**Finalizar:** crea cuentas vía `POST /api/v1/account/create` (HU-005), luego marca `onboardingCompleted: true`. Si el endpoint de cuentas aún no existe (404/405): marca onboarding como done igual.

### Router guard actualizado
Redirige a `/onboarding` si `requiresAuth && isAuthenticated && !isOnboarded && to.name !== 'onboarding'`

### App.vue actualizado
- `authRoutes` incluye ahora: `forgot-password`, `reset-password`, `onboarding` (sin sidebar)
- Banner persistente si `onboarding_skipped === 'true'` en localStorage: fondo indigo suave, link a `/cuentas`, botón X para descartar
- `dismissOnboardingBanner()` limpia el flag y oculta el banner

### auth store — nuevo método `updateProfile(data)`
Llama `PUT /api/v1/auth/profile` con cualquier subconjunto de campos y actualiza `user.value` en estado local.

### Nota para HU-005
La creación de cuentas en el wizard llama `POST /api/v1/account/create`. Funcionará automáticamente cuando el backend de HU-005 esté implementado.

### Nota para HU-007/008
El bloqueo de formularios de gasto/ingreso sin cuenta registrada se implementará en HU-007/008 cuando haya acceso al endpoint de cuentas.

## Pendiente

- HU-005 y subsiguientes
