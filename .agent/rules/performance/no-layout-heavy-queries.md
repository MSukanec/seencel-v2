---
name: No queries pesadas en layouts
description: Los layouts solo deben cargar datos mínimos para renderizar la UI base (sidebar, header).
severity: critical
---

# ⛔ Prohibido: Queries Pesadas en Layouts

## Regla

Los archivos `layout.tsx` del dashboard **SOLO** deben cargar datos estrictamente necesarios para renderizar la UI base:

- Perfil del usuario (nombre, avatar)
- Organización activa (id, nombre, logo)
- Permisos/roles mínimos
- Feature flags

## Prohibido en layouts

| ❌ No cargar en layout | ✅ Dónde cargarlo |
|------------------------|-------------------|
| Datos financieros (monedas, wallets) | En las páginas/features que los usan |
| Lista de proyectos | En la página de proyectos |
| Lista de clientes | En la página de clientes |
| Datos de widgets | En cada widget individual |
| Invitaciones pendientes | En el sidebar o como componente lazy |

## Por qué

El layout se ejecuta en **cada navegación**. Cualquier query en el layout bloquea el render de **todas** las páginas hijas. Si el layout tarda 2s, todas las páginas tardan mínimo 2s.

## Detección

Si ves un `layout.tsx` con más de 3-4 fetches de datos, o con queries que traen datos de dominio específico (finanzas, proyectos, clientes), está violando esta regla.

```tsx
// ❌ PROHIBIDO en layout.tsx
const [user, orgs, financial, projects, clients] = await Promise.all([
    getUserProfile(),
    getUserOrganizations(),
    getOrganizationFinancialData(orgId),  // ← Sacar
    getOrganizationProjects(orgId),        // ← Sacar
    getClientsByOrganization(orgId),       // ← Sacar
]);

// ✅ CORRECTO: Solo lo mínimo
const [user, orgs] = await Promise.all([
    getUserProfile(),
    getUserOrganizations(),
]);
```
