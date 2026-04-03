# memory-dba — SaaSFinancial

## Schema aplicado
Migración `20260328194227_InitialCreate` aplicada el 2026-03-28 en la BD local `mifinanza`.

## Tablas creadas

| Tabla | Descripción | Soft Delete |
|---|---|---|
| `profiles` | Perfiles de usuario (autenticación nativa o OAuth) | Sí — `deleted_at` + `HasQueryFilter` |
| `accounts` | Cuentas financieras (checking, savings, credit_card, cash, investment, loan) | Sí — `deleted_at` + `HasQueryFilter` |
| `categories` | Categorías de transacciones (income / expense) | No — hard delete |
| `transactions` | Transacciones (income / expense) con soporte MSI/MCI | Sí — `deleted_at` + `HasQueryFilter` |
| `transfers` | Transferencias entre cuentas | No — sin delete ni soft delete |
| `subscriptions` | Suscripciones recurrentes (entidad adicional del proyecto) | No |
| `password_reset_tokens` | Tokens para recuperación de contraseña | No (se invalidan por `used_at` y `expires_at`) |

## Relaciones definidas

- `accounts.profile_id` → `profiles.id` (CASCADE)
- `categories.profile_id` → `profiles.id` (CASCADE)
- `transactions.profile_id` → `profiles.id` (CASCADE)
- `transactions.account_id` → `accounts.id` (RESTRICT)
- `transactions.category_id` → `categories.id` NULLABLE (RESTRICT)
- `transfers.profile_id` → `profiles.id` (CASCADE)
- `transfers.from_account_id` → `accounts.id` (RESTRICT)
- `transfers.to_account_id` → `accounts.id` (RESTRICT)
- `subscriptions.profile_id` → `profiles.id` (CASCADE)
- `subscriptions.category_id` → `categories.id` NULLABLE (SET NULL)
- `subscriptions.account_id` → `accounts.id` NULLABLE (SET NULL)
- `password_reset_tokens.profile_id` → `profiles.id` (CASCADE)

## Índices definidos

- `profiles.email` UNIQUE
- `accounts.profile_id`
- `categories.profile_id`
- `transactions.profile_id`
- `transactions.date`
- `transactions.account_id`
- `transactions.category_id`
- `transfers.profile_id`
- `transfers.from_account_id`
- `transfers.to_account_id`
- `subscriptions.profile_id`
- `subscriptions.category_id`
- `subscriptions.account_id`
- `password_reset_tokens.profile_id`

## Constraints especiales

- `transfers`: CHECK `from_account_id <> to_account_id` — previene transferencias a sí mismo
- `transactions.category_id`: nullable (transacción sin categoría válida)
- `profiles.password_hash`: nullable (cuentas OAuth no tienen contraseña)

## Tipos de datos importantes

- `balance`, `amount`, `credit_limit`: `DECIMAL(18,2)` — precisión financiera
- `installment_rate` en transactions: `DECIMAL(5,4)` — tasa anual con 4 decimales
- `date` en transactions / transfers: `DATE` (solo fecha, no timestamp)
- Todos los IDs: `UUID` con `DEFAULT gen_random_uuid()`
- Timestamps: `timestamp without time zone` (EF Core mapea `DateTime` sin `Tz` explícito)

## Decisiones de diseño

1. **Soft delete solo en 3 tablas**: `profiles`, `accounts`, `transactions`. Las transferencias no se borran (se editan), las categorías se borran hard (validando transacciones activas en el servicio), las suscripciones y tokens no aplican delete.
2. **FK `user_id` → `profile_id`**: el schema anterior usaba `user_id` en todas las tablas. Se renombró a `profile_id` para consistencia — el campo `user_id` en los handlers es el ID del JWT (del contexto HTTP), distinto al campo de BD.
3. **`transactions.category_id` nullable**: permite registrar transacciones sin categoría asignada.
4. **`LoginService` con `IgnoreQueryFilters()`**: el login consulta `profiles` ignorando el query filter de soft delete para poder retornar mensaje adecuado. Luego valida `DeletedAt == null` manualmente.
5. **`subscriptions` tabla adicional**: no está en el schema requerido por HU-000 pero existía en el proyecto previo. Se mantuvo y migró a `profile_id` para consistencia.
6. **Warnings EF Core (10622)**: `ProfileEntity` tiene `HasQueryFilter` y es el extremo requerido de relaciones con `CategoryEntity`, `PasswordResetTokenEntity` y `SubscriptionEntity`. Son informativos — no representan un bug funcional en el flujo actual donde los perfiles siempre existen al consultar entidades relacionadas.

## Migraciones

| Nombre | Fecha | Estado |
|---|---|---|
| `20260328194227_InitialCreate` | 2026-03-28 | Aplicada en local |
| `20260402234730_AddAccountMetadataFields` | 2026-04-02 | Aplicada en local |

### `20260402234730_AddAccountMetadataFields` — Detalle

Agrega 5 columnas a la tabla `accounts`:

```sql
ALTER TABLE accounts ADD bank_name text;
ALTER TABLE accounts ADD color text NOT NULL DEFAULT '';
ALTER TABLE accounts ADD icon text NOT NULL DEFAULT '';
ALTER TABLE accounts ADD include_in_totals boolean NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD notes text;
```

**Motivo:** Los campos existían en el request DTO (`CreateAccountRequest`) y en los CommandHandlers desde el inicio, pero no estaban mapeados en `AccountEntity` ni en `AccountModel`. Los datos se aceptaban en el endpoint pero se descartaban silenciosamente sin persistirse.

**Columnas completas de `accounts` tras la migración:**

`id`, `profile_id`, `name`, `type`, `balance`, `currency`, `credit_limit`, `cut_day`, `payment_day`, `bank_name`, `color`, `icon`, `notes`, `include_in_totals`, `is_active`, `created_at`, `updated_at`, `deleted_at`

## Estado: COMPLETADO (HU-000 DBA)
