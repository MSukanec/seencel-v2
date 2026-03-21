/**
 * Mapping from app routes to documentation slugs.
 * 
 * When a user is on a route that has an entry here,
 * the "Documentación" button will appear in the header.
 * 
 * Format: { slug, exactOnly? }
 * - slug: matches the folder/file structure in content/docs/
 * - exactOnly: if true, only exact pathname match shows the button
 *   (prevents /organizacion from being a catch-all for all sub-routes)
 * 
 * The route key should match the pathname (without locale).
 */

interface DocsMapping {
    slug: string;
    /** If true, only show docs button on exact route match (no prefix matching) */
    exactOnly?: boolean;
}

export const FEATURE_DOCS_MAP: Record<string, DocsMapping> = {
    // Organization Catalog — root (Catálogo Técnico)
    '/organization/catalog': { slug: 'catalogo-tecnico/materiales' },
    '/organizacion/catalogo': { slug: 'catalogo-tecnico/materiales' },

    // Tasks Catalog (Tareas)
    '/organization/catalog/tasks': { slug: 'catalogo-tecnico/tareas' },
    '/organizacion/catalogo/tareas': { slug: 'catalogo-tecnico/tareas' },

    // Task Detail — Recipe sub-routes (Recetas)
    '/organization/catalog/task/': { slug: 'catalogo-tecnico/recetas' },
    '/organizacion/catalogo/tarea/': { slug: 'catalogo-tecnico/recetas' },

    // Materials Catalog (Materiales)
    '/organization/catalog/materials': { slug: 'catalogo-tecnico/materiales' },
    '/organizacion/catalogo/materiales': { slug: 'catalogo-tecnico/materiales' },

    // Labor Catalog (Mano de Obra) — future
    '/organization/catalog/labor': { slug: 'catalogo-tecnico/materiales' },
    '/organizacion/catalogo/mano-de-obra': { slug: 'catalogo-tecnico/materiales' },

    // General Costs (Gastos Generales)
    '/organization/general-costs': { slug: 'finanzas/gastos-generales' },
    '/organizacion/gastos-generales': { slug: 'finanzas/gastos-generales' },

    // Quotes & Contracts (Presupuestos)
    '/organization/quotes': { slug: 'finanzas/presupuestos' },
    '/organizacion/presupuestos': { slug: 'finanzas/presupuestos' },

    // Projects
    '/organization/projects': { slug: 'organizacion/proyectos' },
    '/organizacion/proyectos': { slug: 'organizacion/proyectos' },

    // Construction Tasks (Ejecución de Tareas) - project level
    '/project/': { slug: 'construccion/ejecucion-de-tareas' },
    '/proyecto/': { slug: 'construccion/ejecucion-de-tareas' },

    // Organization (Dashboard principal) - EXACT ONLY to prevent
    // catch-all for sub-routes like /organizacion/gastos-generales
    '/organization': { slug: 'organizacion/proyectos', exactOnly: true },
    '/organizacion': { slug: 'organizacion/proyectos', exactOnly: true },

    // Planner (Planificador)
    '/organization/planner': { slug: 'organizacion/planificador' },
    '/organizacion/planificador': { slug: 'organizacion/planificador' },

    // Files (Archivos)
    '/organization/files': { slug: 'organizacion/archivos' },
    '/organizacion/archivos': { slug: 'organizacion/archivos' },

    // Contacts (Contactos)
    '/organization/contacts': { slug: 'organizacion/contactos' },
    '/organizacion/contactos': { slug: 'organizacion/contactos' },

    // Sitelog (Bitácora de Obra)
    '/organization/sitelog': { slug: 'construccion/bitacora-de-obra' },
    '/organizacion/bitacora': { slug: 'construccion/bitacora-de-obra' },

    // Settings (Configuración) — Miembros
    '/organization/settings/members': { slug: 'organizacion/equipo' },
    '/organizacion/configuracion/miembros': { slug: 'organizacion/equipo' },

    // Add more feature -> docs mappings here as documentation is created
};

/**
 * Get the documentation slug for a given pathname.
 * Returns null if no documentation exists for that route.
 */
export function getDocsSlugForPath(pathname: string): string | null {
    // Remove locale prefix if present
    const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '');

    // Try exact match first
    if (FEATURE_DOCS_MAP[pathWithoutLocale]) {
        return FEATURE_DOCS_MAP[pathWithoutLocale].slug;
    }

    // Try prefix match (for nested routes like /organization/catalog/task/123)
    // Skip entries marked as exactOnly
    for (const [routePrefix, mapping] of Object.entries(FEATURE_DOCS_MAP)) {
        if (mapping.exactOnly) continue;
        if (pathWithoutLocale.startsWith(routePrefix)) {
            return mapping.slug;
        }
    }

    return null;
}

/**
 * Check if documentation exists for a given docs path (e.g. "/docs/proyectos").
 * Used by ViewEmptyState to conditionally show the "Documentación" button.
 *
 * This replaces the old docs-registry.ts — we derive the answer from
 * the mapping itself, so there's a single source of truth.
 */
export function hasDocsForPath(docsPath: string): boolean {
    // Normalize: "/docs/proyectos/introduccion" → "proyectos/introduccion"
    const normalized = docsPath.replace(/^\/docs\//, '');

    // Check if any mapping points to this slug or a sub-slug
    for (const mapping of Object.values(FEATURE_DOCS_MAP)) {
        if (mapping.slug === normalized) return true;
        // e.g. docsPath="/docs/materiales" matches slug="materiales/introduccion"
        if (mapping.slug.startsWith(normalized + '/')) return true;
        if (normalized.startsWith(mapping.slug.split('/')[0])) return true;
    }

    return false;
}
