# Design Decisions: Capital

---

## Decisiones de Diseño

### D1: Tres tablas separadas vs una tabla unificada de movimientos

- **Elegimos**: Tres tablas separadas (`partner_contributions`, `partner_withdrawals`, `capital_adjustments`)
- **Alternativa descartada**: Una tabla única `capital_movements` con columna `type`
- **Razón**: Cada tipo tiene columnas distintas (contributions tiene `contribution_date` y `wallet_id`, adjustments tiene `reason` y NO tiene `wallet_id`). La separación permite RLS, validaciones y constraints específicos por tipo.

### D2: Balance materializado con trigger

- **Elegimos**: Tabla `partner_capital_balance` actualizada automáticamente por triggers
- **Alternativa descartada**: Calcular el balance en una view (sum en tiempo real)
- **Razón**: Performance. Con miles de movimientos, sumar en cada lectura es costoso. El trigger garantiza que el balance siempre esté actualizado sin costo de lectura.

### D3: Vista unificada para lectura (capital_ledger_view)

- **Elegimos**: `capital_ledger_view` que hace UNION ALL de las 3 tablas con un `movement_type` discriminador
- **Razón**: El frontend necesita un timeline unificado de todos los movimientos. La view lo resuelve sin JOIN complejo ni lógica en el frontend.

### D4: KPI view con desviaciones calculadas en SQL

- **Elegimos**: `capital_partner_kpi_view` calcula `expected_contribution`, `deviation`, `real_ownership_ratio` y `contribution_status` directamente en SQL
- **Alternativa descartada**: Calcular en el frontend
- **Razón**: Principio "el modelo de datos manda" (Rule 9). Los KPIs son lógica de negocio → pertenecen a la DB. El frontend solo muestra.

### D5: Participante vinculado a Contact, no a User

- **Elegimos**: `capital_participants.contact_id` → `contacts.contacts.id`
- **Alternativa descartada**: FK a `users.id`
- **Razón**: Un socio puede ser una persona o empresa que no tiene cuenta en Seencel. Los contactos son la tabla de directorio de la org. Si el contacto está vinculado a un user (`linked_user_id`), se resuelve ahí.

---

## Edge Cases y Gotchas

### E1: Aportes en diferentes monedas

- **Impacto**: Hoy `capital_ledger_view` suma `amount` sin considerar moneda. Si un socio aporta en USD y otro en ARS, los totales son incorrectos.
- **Solución futura**: Usar `amount * exchange_rate` en la view para obtener `functional_amount` en moneda funcional de la org. Las views `capital_partner_balances_view` y `capital_organization_totals_view` ya suman `amount` directo — necesitan convertir a functional.

### E2: Ajustes sin wallet

- **Impacto**: `capital_adjustments` no tiene `wallet_id`. Los ajustes no representan movimiento real de dinero, solo correcciones contables.
- **Solución futura**: Está bien así. Si un ajuste necesita wallet, debería ser un aporte o retiro.

### E3: Participante sin % de ownership

- **Impacto**: El `capital_partner_kpi_view` devuelve `contribution_status = 'sin_porcentaje'` y `NULL` para cálculos de desviación.
- **Solución futura**: El frontend debe mostrar "N/A" en las columnas de desviación y un badge "Sin %" en el participante.

### E4: Soft delete sin DELETE RLS policy

- **Impacto**: No hay policies DELETE en ninguna tabla de capital. Los triggers de balance se disparan en INSERT/UPDATE/DELETE, así que un hard delete rompería el balance materializado.
- **Solución futura**: Agregar DELETE policy con `can_mutate_org(..., 'finance.manage')` en las 4 tablas, o aceptar que solo se usa soft delete.

### E5: Ledger view filtra solo status='confirmed'

- **Impacto**: Movimientos en estado `pending` o `rejected` NO aparecen en el ledger ni en los cálculos de balance.
- **Solución futura**: Está bien para balances. Pero para el tab de movimientos, podría ser útil mostrar pendientes/rechazados con un badge de estado.

---

## Relación con otros Flows

| Flow | Conexión |
|------|----------|
| **Finanzas / Movimientos** | Capital no se refleja en `finance.movements` (son flujos paralelos). Podrían integrarse en el futuro con un ledger unificado. |
| **Contactos** | `capital_participants.contact_id` vincula al directorio de contactos de la org. |
| **Billeteras** | Aportes y retiros usan `wallet_id` → `organization_wallets`. Impactan el saldo de las billeteras de la org. |
| **Proyectos** | Aportes/retiros pueden tener `project_id` opcional → associated a un proyecto específico. |
