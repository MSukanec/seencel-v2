# Capital — Gestión de Aportes y Retiros de Socios

> **Alcance**: Registrar participantes (socios inversores), sus aportes de capital, retiros y ajustes. Calcular balances en tiempo real y comparar con porcentaje de participación esperado.

## ¿Qué resuelve?

**Escenario**: María y Juan son socias al 60/40 en "Constructora Sur". María aportó $5.000.000 y Juan $2.000.000. Juan luego retiró $500.000. El sistema calcula automáticamente que:
- Capital neto de María: $5.000.000 (71.4% del total)
- Capital neto de Juan: $1.500.000 (28.6% del total)
- Juan está **bajo-aportado** respecto a su 40% esperado

Sin Capital, los socios llevan una planilla Excel aparte o directamente no lo trackean.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Participante** | Socio/inversor vinculado a un contacto | `finance.capital_participants` |
| **Aporte** | Ingreso de dinero de un socio | `finance.partner_contributions` |
| **Retiro** | Salida de dinero de un socio | `finance.partner_withdrawals` |
| **Ajuste** | Corrección de balance (+ o -) | `finance.capital_adjustments` |
| **Balance** | Tabla materializada con saldo actual | `finance.partner_capital_balance` |
| **% Participación** | Porcentaje esperado de cada socio | `capital_participants.ownership_percentage` |

## Flujo resumido

```
Agregar Participante → Registrar Aportes/Retiros → Balance Auto-Calculado → Dashboard KPIs
         ↓                        ↓                        ↓
  capital_participants    partner_contributions     partner_capital_balance
                          partner_withdrawals        (trigger automático)
                          capital_adjustments
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Este archivo — overview y conceptos |
| [user-journey.md](./user-journey.md) | Paso a paso del usuario con tablas y archivos |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado completado + pendientes accionables |
