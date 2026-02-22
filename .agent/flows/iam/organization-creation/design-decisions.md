# Design Decisions: Creación de Organización

> Decisiones de diseño, edge cases, gotchas y patrones.

---

## Decisiones Arquitectónicas

### 1. Single RPC Atómico

**Decisión**: Toda la creación se ejecuta en un solo RPC (`handle_new_organization`) con EXCEPTION handler.

**Razón**: Si falla cualquier step, la transacción se revierte completa. No quedan orgs huérfanas sin roles o miembros.

**Trade-off**: La función es larga (9 steps) pero garantiza atomicidad.

---

### 2. Step Functions como Helper

**Decisión**: Cada step es una función independiente (`step_create_organization`, `step_add_org_member`, etc.)

**Razón**: 
- Reutilización: las step functions se pueden llamar desde otros flujos (ej: migración, seeding)
- Testing: cada step se puede probar aisladamente
- Legibilidad: `handle_new_organization` queda como orquestador limpio

---

### 3. UUIDs Hardcodeados para Defaults

**Decisión**: Plan Free, moneda ARS, billetera Efectivo, PDF template → UUIDs hardcodeados en la función.

**Razón**: Son datos semilla que nunca cambian. Evita queries adicionales.

**Riesgo**: Si se recrean en otra instancia, los UUIDs serían distintos. Solo funciona porque Supabase tiene UNA instancia de producción.

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

### ⚠️ Gotcha 1: Dead Code — workspace-setup-view duplicado

**Problema**: Existen DOS archivos `workspace-setup-view.tsx`:
- `src/app/[locale]/(onboarding)/workspace-setup/workspace-setup-view.tsx` — **DEAD CODE**, versión vieja sin org type step
- `src/features/onboarding/views/workspace-setup-view.tsx` — **VERSION ACTIVA**, la que importa `page.tsx`

**Impacto**: Ninguno funcional (no se importa), pero confunde a desarrolladores.

**Acción**: Borrar el archivo viejo en `app/.../workspace-setup-view.tsx`.

---

### ⚠️ Gotcha 2: step_create_default_kanban_board Orphan

**Problema**: Existe `iam.step_create_default_kanban_board(p_org_id)` como función separada, pero `handle_new_organization` usa código inline en Step 9.

**Diferencias**:
| Aspecto | Función orphan | Inline (activo) |
|---------|---------------|-----------------|
| Nombre board | "Mi Panel" | "General" |
| Listas | No crea listas | 3 listas (Por Hacer, En Progreso, Hecho) |
| Triggers | Deshabilita/habilita trigger | No toca triggers |
| created_by | NULL | v_member_id |

**Impacto**: La función orphan no se usa. Si alguien la llama esperando el comportamiento actual, se rompe.

**Acción**: Unificar o eliminar la función orphan.

---

### ⚠️ Gotcha 3: step_create_organization con Overloads

**Problema**: Existen dos versiones de `iam.step_create_organization`:
1. **3 params**: `(p_owner_id, p_org_name, p_plan_id)` — search_path `'iam', 'billing', 'public'` — NO inserta `business_mode`
2. **4 params**: `(p_owner_id, p_org_name, p_plan_id, p_business_mode DEFAULT 'professional')` — search_path `'iam', 'billing'` — SÍ inserta `business_mode`

`handle_new_organization` llama con 4 args → usa la versión correcta. Pero la versión de 3 params es dead code.

**Acción**: Eliminar el overload de 3 params.

---

### ⚠️ Gotcha 4: feature_flags sin .schema()

**Problema**: En `workspace-setup/page.tsx` línea 28:
```ts
supabase.from('feature_flags').select('status').eq('key', 'org_creation_enabled').single()
```

No usa `.schema()`. Funciona porque `feature_flags` está en `public`, que es el schema default de PostgREST. Pero es inconsistente con el patrón del proyecto que usa `.schema()` explícito.

**Impacto**: Bajo — funciona. Pero si `feature_flags` se migra a otro schema, se rompe silenciosamente.

---

### ⚠️ Gotcha 5: Trigger log_member_billable_change

**Problema histórico**: El trigger `audit.log_member_billable_change()` referenciaba `organization_member_events` sin prefijo schema → fallaba porque la tabla está en `billing.`.

**Fix**: DB/084 corrigió la referencia a `billing.organization_member_events`.

**Estado actual**: ✅ Corregido (requiere ejecutar DB/084 en producción si no se hizo).

---

### ⚠️ Gotcha 6: Rate Limiting

**Detalle**: `handle_new_organization` tiene rate limiting: máximo 3 orgs por hora por usuario.

```sql
SELECT count(*) INTO v_recent_count
FROM iam.organizations
WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';
```

**Nota**: Este rate limit es por usuario, no por IP. Un usuario malicioso podría crear múltiples cuentas.

---

### ⚠️ Gotcha 7: Doble upsert de user_organization_preferences

**Problema**: `user_organization_preferences` se toca dos veces:
1. Dentro del frontend action `createOrganization()` (línea 133-141)
2. Pero NO dentro del RPC

El RPC sí actualiza `user_preferences.last_organization_id` (línea 117-119). Ambas son diferentes tablas, así que no hay conflicto real. Pero `step_create_user_organization_preferences` existe como step function y NO se llama desde `handle_new_organization`.

**Impacto**: Menor — el action lo maneja. Pero si se llama al RPC desde otro lugar, no se crea el record de `user_organization_preferences`.

---

## Patrones Establecidos

### Patrón: Step Function

Todas las step functions siguen el mismo patrón:
1. `SECURITY DEFINER` con `search_path` explícito
2. `EXCEPTION WHEN OTHERS THEN` → log con `ops.log_system_error()` → `RAISE`
3. Parámetros validados (nulls)
4. Single INSERT

### Patrón: Error Logging

```sql
PERFORM ops.log_system_error(
    'function',           -- source_type
    'step_name',          -- source_name
    'signup',             -- context
    SQLERRM,              -- message
    jsonb_build_object(), -- metadata
    'critical'            -- severity
);
```
