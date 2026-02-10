/**
 * Mapping from app routes to documentation slugs.
 * 
 * When a user is on a route that has an entry here,
 * the "Documentación" button will appear in the header.
 * 
 * Format: 'route-prefix' => 'docs-slug'
 * 
 * The route-prefix should match the pathname (without locale).
 * The docs-slug should match the folder/file structure in content/docs/
 */
export const FEATURE_DOCS_MAP: Record<string, string> = {
    // Organization Catalog (Catálogo Técnico)
    '/organization/catalog': 'materiales/introduccion',
    '/organizacion/catalogo': 'materiales/introduccion',

    // Finance
    '/organization/finance': 'finanzas/introduccion',
    '/organizacion/finanzas': 'finanzas/introduccion',

    // Projects
    '/organization/projects': 'proyectos/introduccion',
    '/organizacion/proyectos': 'proyectos/introduccion',

    // Construction Tasks (Ejecución de Obra) - project level
    '/project/': 'ejecucion-de-obra/introduccion',
    '/proyecto/': 'ejecucion-de-obra/introduccion',

    // Add more feature -> docs mappings here as documentation is created

    // Organization (Dashboard principal)
    '/organization': 'organizacion/introduccion',
    '/organizacion': 'organizacion/introduccion',

    // Planner (Agenda)
    '/organization/planner': 'agenda/introduccion',
    '/organizacion/planificador': 'agenda/introduccion',
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
        return FEATURE_DOCS_MAP[pathWithoutLocale];
    }

    // Try prefix match (for nested routes like /organization/catalog/task/123)
    for (const [routePrefix, docsSlug] of Object.entries(FEATURE_DOCS_MAP)) {
        if (pathWithoutLocale.startsWith(routePrefix)) {
            return docsSlug;
        }
    }

    return null;
}
