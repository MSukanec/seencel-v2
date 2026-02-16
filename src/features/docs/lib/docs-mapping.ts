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

    // Finance
    '/organization/finance': { slug: 'finanzas/introduccion' },
    '/organizacion/finanzas': { slug: 'finanzas/introduccion' },

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

    // Planner (Planificador)
    '/organization/planner': { slug: 'agenda/introduccion' },
    '/organizacion/planificador': { slug: 'agenda/introduccion' },

    // Files (Archivos)
    '/organization/files': { slug: 'archivos/introduccion' },
    '/organizacion/archivos': { slug: 'archivos/introduccion' },

    // Contacts (Contactos)
    '/organization/contacts': { slug: 'contactos/introduccion' },
    '/organizacion/contactos': { slug: 'contactos/introduccion' },

    // Settings (Configuración) — Índices Económicos tab
    '/organization/settings': { slug: 'indices-economicos' },
    '/organizacion/configuracion': { slug: 'indices-economicos' },


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
