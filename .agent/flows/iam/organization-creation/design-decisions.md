# Design Decisions: Creación de Organización

> Decisiones de diseño, edge cases, gotchas y patrones.
> **Actualizado**: 2026-02-22 — Consolidación DB/088 + Currency Selector DB/089.

---

## Decisiones Arquitectónicas

### 1. Single RPC Atómico — Todo Inline

**Decisión**: Toda la creación se ejecuta en un solo RPC (`handle_new_organization`) con EXCEPTION handler y **lógica inline** (sin step functions externas).

**Razón**: 
- Atomicidad: si falla cualquier paso, la transacción se revierte completa
- Simplicidad: una sola función con todo el flujo visible
- Mantenibilidad: no hay funciones auxiliares dispersas que mantener sincronizadas

**Evolución**: Originalmente usaba 8 step functions separadas. En DB/088 se consolidó todo inline y se droppearon las step functions.

---

### 2. UUIDs Hardcodeados para Defaults

**Decisión**: Plan Free, billetera Efectivo, PDF template → UUIDs hardcodeados en la función.

**Razón**: Son datos semilla que nunca cambian. Evita queries adicionales.

**Riesgo**: Si se recrean en otra instancia, los UUIDs serían distintos. Solo funciona porque Supabase tiene UNA instancia de producción.

---

### 3. Moneda Seleccionable con Fallback ARS

**Decisión**: El usuario elige la moneda principal durante el onboarding. Si no elige (o llama el RPC sin parámetro), se usa ARS como fallback.

**Implementación**: `v_default_currency_id uuid := COALESCE(p_default_currency_id, '58c50aa7-...')` en la declaración de variables.

**Razón**: 
- Backward compatible: RPCs existentes o futuros no fallan
- Explícito: el usuario toma una decisión informada (el tooltip explica que no se puede cambiar)
- Simple: un solo COALESCE en la variable, se usa en steps 6 y 8

---

### 4. Business Mode como Feature Flag Visual

**Decisión**: "Proveedor" existe como opción pero está bloqueada visualmente para no-admins. Admin puede bypass.

**Razón**: Preparación para futuro sin agregar complejidad SQL ahora. El campo `business_mode` ya existe en la tabla.

---

### 5. Logo Upload Post-Creación (Non-Blocking)

**Decisión**: El logo se sube DESPUÉS del RPC, en un paso separado, y si falla no bloquea la creación.

**Razón**: La creación de la org NO debe fallar por un problema de storage. El usuario puede subir el logo después desde Settings.

---

### 6. Redirect via throw

**Decisión**: `createOrganization()` usa `redirect('/organization')` de Next.js, que internamente hace `throw NEXT_REDIRECT`.

**Razón**: Patrón estándar de Next.js. El catch vacío en el frontend es intencional.

---

## Edge Cases y Gotchas

### ⚠️ Gotcha 1: Rate Limiting

`handle_new_organization` tiene rate limiting: máximo 3 orgs por hora por usuario. Este rate limit es por usuario, no por IP.

### ⚠️ Gotcha 2: user_organization_preferences desde el Action

`user_organization_preferences` se gestiona en el frontend action, no dentro del RPC. El RPC sí actualiza `user_preferences.last_organization_id` (diferente tabla). Si se llama al RPC desde otro contexto, no se crea el record de `user_organization_preferences`.

### ⚠️ Gotcha 3: Trigger log_member_billable_change

Corregido por DB/084. El trigger `audit.log_member_billable_change()` ahora referencia correctamente `billing.organization_member_events` con schema explícito.

---

## Patrón: Error Logging

```sql
PERFORM ops.log_system_error(
    'function',           -- source_type
    'handle_new_organization', -- source_name
    'organization',       -- context
    SQLERRM,              -- message
    jsonb_build_object(
        'user_id', p_user_id,
        'organization_name', p_organization_name,
        'business_mode', p_business_mode,
        'default_currency_id', p_default_currency_id
    ),
    'critical'            -- severity
);
```
