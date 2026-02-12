# Plan: Unificación de Contextos Organización/Proyecto

> **Objetivo**: Eliminar `/project/[projectId]/` como ruta. Todo vive bajo `/organization/...`. El selector del header es un **filtro global** (sin proyecto = datos org, con proyecto = filtrado).

---

## Decisiones Confirmadas

| Pregunta | Respuesta |
|----------|-----------|
| `clients/` vs `contacts/` | **Diferentes**. Contactos = nivel org sin filtro. Clientes = ambos contextos |
| `details/` | Dejarlo para más adelante |
| `health/` | Sí tiene sentido sin filtro (salud general de la org) |
| `portal/` | Rehacer después, no priorizar ahora |
| `sitelog/` | Sí tiene sentido a nivel org, agregar indicador de proyecto |
| `construction-tasks/` | Sí, super potente en modo org (Gantt de todos los proyectos) |
| Orden | Infraestructura → páginas ya revisadas → ir bajando una por una |

---

## Orden de Ejecución

### Bloque 0: Infraestructura
- [ ] Crear `useProjectFilterStore` (Zustand)
- [ ] Refactorizar `HeaderOrgProjectSelector` → escribe en el store + opción "Organización"
- [ ] Actualizar sidebar → todas las rutas apuntan a `/organization/...`
- [ ] Actualizar `routing.ts` → agregar nuevas rutas, mantener viejas temporalmente

### Bloque 1: Páginas YA REVISADAS (agregar soporte de filtro)
- [ ] 1. Visión General ORG (`/organization`) — unificar con Overview Proyecto
- [ ] 2. Planificación (`/organization/planner`) — unificar con Planner Proyecto
- [ ] 3. Documentación (`/organization/files`) — unificar con Files Proyecto
- [ ] 4. Proyectos (`/organization/projects`) — no necesita filtro, ya es org-only

### Bloque 2: Páginas ORG no revisadas aún
- [ ] 5. Presupuestos (`/organization/quotes`) — unificar con Quotes Proyecto
- [ ] 6. Finanzas (`/organization/finance`) — unificar con Finance Proyecto
- [ ] 7. Identidad (`/organization/identity`) — org-only, no necesita filtro
- [ ] 8. Catálogo Técnico (`/organization/catalog`) — org-only, no necesita filtro
- [ ] 9. Contactos (`/organization/contacts`) — org-only, no necesita filtro
- [ ] 10. Capital (`/organization/capital`) — org-only, no necesita filtro
- [ ] 11. Gastos Generales (`/organization/general-costs`) — evaluar
- [ ] 12. Informes (`/organization/reports`) — evaluar
- [ ] 13. Avanzado (`/organization/advanced`) — org-only

### Bloque 3: Páginas a CREAR (vienen de /project/)
- [ ] 14. Tareas de Construcción (`/organization/construction-tasks`) [NEW]
- [ ] 15. Materiales (`/organization/materials`) [NEW]
- [ ] 16. Mano de Obra (`/organization/labor`) [NEW]
- [ ] 17. Subcontratos (`/organization/subcontracts`) [NEW]
- [ ] 18. Clientes (`/organization/clients`) [NEW]
- [ ] 19. Salud (`/organization/health`) [NEW]
- [ ] 20. Bitácora (`/organization/sitelog`) [NEW]

### Bloque 4: Páginas a REHACER (futuro)
- [ ] Portal de Clientes
- [ ] Detalles de Proyecto (integrar en vista de proyectos)

### Bloque 5: Limpieza Final
- [ ] Eliminar `/project/[projectId]/` completo
- [ ] Limpiar `routing.ts`
- [ ] Agregar redirects `/project/X/...` → `/organization/...`
- [ ] Limpiar sidebar navigation

---

## Patrón de Migración

Cada página sigue este patrón:

### Para páginas DUPLICADAS (finance, quotes, planner, files)
1. La page.tsx de `/organization/` ya existe
2. La view recibe datos de TODA la org (sin filtrar)
3. La view lee `useProjectFilterStore` → filtra client-side
4. Los forms detectan si hay filtro → pre-llenan proyecto
5. Se elimina la versión `/project/[projectId]/` correspondiente

### Para páginas SOLO PROYECTO → NUEVA en org
1. Crear `page.tsx` en `/organization/nueva-ruta/`
2. Query trae datos de TODA la org
3. La view filtra por proyecto si el store tiene filtro activo
4. Si no hay filtro + no hay datos → empty state "Seleccioná un proyecto o creá uno"
5. Si no hay filtro + hay datos → muestra todos con columna "Proyecto"

### Para páginas ORG-ONLY (contacts, catalog, identity...)
1. No necesitan cambios de filtro
2. Solo aplican la review (`/review-page` checklist)

---

## Arquitectura del Store

```ts
// src/stores/project-filter-store.ts
interface ProjectFilterState {
  activeProjectId: string | null; // null = toda la org
  setActiveProject: (id: string | null) => void;
}
```

El header selector:
- Muestra "Organización" como primera opción (activeProjectId = null)
- Lista proyectos activos
- Seleccionar uno → setActiveProject(id)
- Seleccionar "Organización" → setActiveProject(null)

---

*Última actualización: 2026-02-12*
