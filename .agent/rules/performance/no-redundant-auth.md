---
name: No re-autenticación redundante
description: Prohibido llamar a getActiveOrganizationId() o supabase.auth.getUser() múltiples veces en el mismo request.
severity: medium
---

# ⛔ Prohibido: Re-autenticación Redundante

## Regla

Dentro de un mismo request (page render, server action), la cadena de autenticación (`auth.getUser()` → `users` → `user_preferences`) **SOLO** debe ejecutarse **UNA VEZ**. El resultado debe pasarse como parámetro a las funciones que lo necesiten.

## Patrón prohibido

```tsx
// ❌ PROHIBIDO: Cada función resuelve auth por su cuenta
export default async function Page() {
    const financial = await getOrganizationFinancialData(); // auth + user + preferences
    const projects = await getOrganizationProjects();       // auth + user + preferences (otra vez)
    const dashboard = await getDashboardLayout();           // auth + user + preferences (otra vez)
    // = 9 queries de auth en vez de 3
}
```

## Patrón correcto

```tsx
// ✅ CORRECTO: Resolver auth UNA vez, pasar como parámetro
export default async function Page() {
    const { userId, orgId } = await resolveAuthContext(); // 3 queries
    const [financial, projects, dashboard] = await Promise.all([
        getOrganizationFinancialData(orgId),   // 0 queries de auth
        getOrganizationProjects(orgId),         // 0 queries de auth  
        getDashboardLayout(userId, orgId),      // 0 queries de auth
    ]);
}
```

## Excepción

Server Actions que se ejecutan de forma aislada (llamadas desde el cliente) SÍ deben resolver su propia autenticación porque no comparten contexto con el page render.

## Por qué

`getActiveOrganizationId()` ejecuta ~3 queries secuenciales a Supabase (auth → users → user_preferences). Si 5 funciones la llaman independientemente, son 15 queries de auth innecesarias (~500ms perdidos).
