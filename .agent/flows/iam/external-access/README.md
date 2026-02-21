# Acceso Externo a Proyectos

> **Alcance**: Todo lo necesario para que una persona **ajena a la organización** (cliente, contador, director de obra externo) pueda entrar a Seencel y ver datos de un proyecto específico.

## ¿Qué resuelve?

Constructora Lenga tiene el proyecto "Colegio Elumar". Mariano, socio del colegio, necesita entrar a Seencel y ver:
- El avance de obra
- Los documentos compartidos
- Los pagos y compromisos de **su** cliente (no de otros)

Pero Mariano **no es empleado** de Constructora Lenga. No es un `organization_member`. Es una persona externa con acceso limitado.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Contacto** | Un registro de CRM (puede ser persona o empresa) | `contacts` |
| **Cliente del proyecto** | Un contacto vinculado a un proyecto con un rol | `project_clients` |
| **Actor externo** | Un usuario de Seencel que pertenece a una org sin ser miembro | `organization_external_actors` |
| **Acceso al proyecto** | Un permiso explícito para que un usuario vea un proyecto | `project_access` |
| **Portal de cliente** | La vista que ve el usuario externo cuando entra a Seencel | Feature `client-portal` |

## Flujo resumido

```
Contacto (CRM) → Actor Externo (usuario Seencel) → Acceso al Proyecto (permisos) → Portal
```

## ⚠️ Regla de Mantenimiento OBLIGATORIA

**Cada vez que se modifique CUALQUIER cosa relacionada con este flow** (tabla, función SQL, archivo frontend, RLS, etc.), se DEBEN actualizar TODOS los archivos de esta carpeta que se vean afectados. No es optativo. Se hace un cambio → se actualizan los docs.

Esto aplica a:
- Agregar/modificar tablas → actualizar `technical-map.md`
- Cambiar lógica de negocio → actualizar `user-journey.md` y `design-decisions.md`
- Completar pendientes → mover items en `roadmap.md` de ⏳ a ✅
- Descubrir gotchas → agregar en `design-decisions.md`
- Crear archivos nuevos → agregar en `technical-map.md`

> **Los docs desactualizados son PEOR que no tener docs.** Si algo cambió y no se actualizó acá, es un bug de documentación.

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [user-journey.md](./user-journey.md) | Paso a paso desde la perspectiva del usuario final |
| [technical-map.md](./technical-map.md) | Tablas, funciones, archivos, RLS — todo nombrado |
| [design-decisions.md](./design-decisions.md) | Por qué se hizo así, edge cases y gotchas |
| [roadmap.md](./roadmap.md) | Estado actual y pendientes de implementación |
