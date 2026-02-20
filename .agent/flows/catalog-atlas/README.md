# Catalog Atlas — Sistema Universal de Tareas de Construcción

> **Alcance**: Define la arquitectura conceptual y técnica del atlas de tareas de construcción de Seencel: cómo se clasifican, parametrizan y extienden las tareas del catálogo técnico.

---

## ¿Qué resuelve?

**Problema real**: Carlos, arquitecto de Buenos Aires, quiere presupuestar "revoques" en un proyecto.
Seencel debe poder responder: *¿Revoque de qué sistema? ¿Grueso o fino? ¿Sobre qué sustrato?*
Y luego mostrarle recetas de materiales + mano de obra con precios de mercado actualizados.

Sin este sistema, dos organizaciones distintas llaman "revoque de paredes" a cosas técnicamente distintas, haciendo imposible la comparación de precios o el benchmarking entre obras.

**El Catalog Atlas resuelve** la comparabilidad global de tareas de construcción mediante una jerarquía estricta:  
`ACTION + ELEMENT + SYSTEM + PARAMETERS → TASK VARIANT → RECIPE`

---

## Principio de diseño fundamental

El sistema es:
1. **Catalog-first**: las tareas están definidas en un atlas técnico unificado
2. **Parametric-second**: los parámetros generan variantes de manera sistemática
3. **AI-assisted third**: la IA solo ayuda a estimar recetas de recursos, nunca define la taxonomía

---

## Las 6 capas del modelo

| Capa | Entidad | Responsabilidad | Tabla |
|------|---------|-----------------|-------|
| **1. Action** | Verbo técnico | Qué se hace: Construir, Demoler, Reparar | `catalog.task_actions` |
| **2. Element** | Componente físico | Sobre qué objeto: Muro, Losa, Cielorraso | `catalog.task_elements` |
| **3. System** | Método técnico | Cómo se hace: Mampostería cerámica, Drywall | `catalog.task_construction_systems` |
| **4. Parameters** | Variantes | Qué diferencia variantes: espesor, tipo de ladrillo | `catalog.task_parameters` + `catalog.task_system_parameters` |
| **5. Task Variant** | Combinación | Instancia única y comparable | `catalog.tasks` |
| **6. Recipe** | Recursos | Materiales + MO + Servicios estimados | `catalog.task_recipes` |

---

## Jerarquía de vinculaciones

```
task_actions  ──→ task_element_actions ──→  task_elements
                                                   │
                                     task_element_systems
                                                   │
                                       task_construction_systems
                                                   │
                                       task_system_parameters
                                                   │
                                           task_parameters
```

Las **tareas** (`catalog.tasks`) resultan de combinar:
```
task_action_id + task_element_id + task_construction_system_id + parameter_values
```

---

## Regla crítica de diseño

> 🚨 **Los parámetros pertenecen al SISTEMA CONSTRUCTIVO, no al ELEMENTO.**

- El elemento "Muro" es genérico. No sabe si usa ladrillo cerámico o bloque.
- El sistema "Mampostería cerámica" sí define que necesita `tipo_ladrillo`, `espesor`, `tipo_mortero`.
- El sistema "Drywall" define `tipo_placa`, `separación_estructura`.

**`task_element_parameters` fue eliminada** por ser conceptualmente incorrecta — fue reemplazada por `task_system_parameters`.

---

## Flujo resumido

```
catalog.task_actions          (cerrado, sistema is_system=true)
        +
catalog.task_elements         (físico, ~20 elementos con soft-delete)
        +
catalog.task_construction_systems  (técnico, extensible, con CRUD)
        |
        └─→ catalog.task_system_parameters  ← parámetros propios del sistema
                    |
                    ↓
            catalog.tasks  (variantes: action + element + system + param_values)
                    |
                    └─→ catalog.task_recipes  (AI-suggested: materials + labor + services)
```

---

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Overview, conceptos, flujo resumido (este archivo) |
| [user-journey.md](./user-journey.md) | Paso a paso: cómo un admin crea y usa tareas del catálogo |
| [technical-map.md](./technical-map.md) | Referencia técnica: tablas, RLS, frontend, SQL scripts |
| [design-decisions.md](./design-decisions.md) | Por qué se tomaron las decisiones de este modelo |
| [roadmap.md](./roadmap.md) | Estado actual y pendientes accionables |
