# memory-frontend — SaaSFinancial

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

## Pendiente

- HU-001 y subsiguientes
