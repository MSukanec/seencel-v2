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
    // Organization Catalog (Catálogo Técnico)
    '/organization/catalog': { slug: 'materiales/introduccion' },
    '/organizacion/catalogo': { slug: 'materiales/introduccion' },

    // General Costs (Gastos Generales)
    '/organization/general-costs': { slug: 'gastos-generales/introduccion' },
    '/organizacion/gastos-generales': { slug: 'gastos-generales/introduccion' },

    // Projects
    '/organization/projects': { slug: 'proyectos/introduccion' },
    '/organizacion/proyectos': { slug: 'proyectos/introduccion' },

    // Construction Tasks (Ejecución de Obra) - project level
    '/project/': { slug: 'ejecucion-de-obra/introduccion' },
    '/proyecto/': { slug: 'ejecucion-de-obra/introduccion' },

    // Organization (Dashboard principal) - EXACT ONLY to prevent
    // catch-all for sub-routes like /organizacion/gastos-generales
    '/organization': { slug: 'organizacion/introduccion', exactOnly: true },
    '/organizacion': { slug: 'organizacion/introduccion', exactOnly: true },

    // Planner (Planificador) — slug updated from agenda to planificador
    '/organization/planner': { slug: 'planificador/introduccion' },
    '/organizacion/planificador': { slug: 'planificador/introduccion' },

    // Files (Documentación) — slug updated from archivos to documentacion
    '/organization/files': { slug: 'documentacion/introduccion' },
    '/organizacion/archivos': { slug: 'documentacion/introduccion' },

    // Contacts (Contactos)
    '/organization/contacts': { slug: 'contactos/introduccion' },
    '/organizacion/contactos': { slug: 'contactos/introduccion' },

    // Settings (Configuración) — Miembros
    '/organization/settings/members': { slug: 'equipo/miembros' },
    '/organizacion/configuracion/miembros': { slug: 'equipo/miembros' },

    // Settings (Configuración) — Índices Económicos
    '/settings/finance': { slug: 'organizacion/indices-economicos', exactOnly: true },
    '/configuracion/finanzas': { slug: 'organizacion/indices-economicos', exactOnly: true },

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
