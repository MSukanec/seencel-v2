/**
 * Mapeo centralizado de slugs de páginas a nombres legibles.
 * 
 * IMPORTANTE: Solo necesitas UNA entrada por página.
 * La función getViewName() normaliza automáticamente:
 * - organization_dashboard → organization/dashboard
 * - es/organization → organization
 * - /organization/ → organization
 */

export const VIEW_NAME_MAP: Record<string, string> = {
    // Páginas raíz
    '': 'Inicio',
    'home': 'Inicio',

    // Dashboard
    'organization': 'Dashboard',
    'organization/dashboard': 'Organización - Dashboard',
    'dashboard': 'Dashboard',

    // Proyectos
    'projects': 'Proyectos',
    'organization/projects': 'Organización - Proyectos',
    'project': 'Detalle Proyecto',

    // Kanban
    'organization/kanban': 'Kanban',
    'kanban': 'Kanban',

    // Academia - Páginas generales (no cursos específicos)
    'academy/courses': 'Academia - Catálogo',
    'academy/my-courses': 'Academia - Mis Cursos',

    // Admin
    'admin': 'Admin General',
    'admin/users': 'Gestión Usuarios',
    'admin/organizations': 'Gestión Organizaciones',

    // Configuración
    'settings': 'Configuración',
    'profile': 'Perfil',

    // Onboarding
    'onboarding': 'Onboarding',

    // Finanzas
    'finanzas': 'Finanzas',

    // Precios
    'pricing': 'Precios',

    // Contacto
    'contact': 'Contacto',
};

/**
 * Mapeo de slugs de cursos a nombres legibles
 */
const COURSE_NAME_MAP: Record<string, string> = {
    'master-archicad': 'Master ArchiCAD',
    // Agregar más cursos aquí según se necesiten
};

/**
 * Normaliza un slug para que coincida con las claves del mapa.
 * Convierte: "es/organization_dashboard?tab=1" → "organization/dashboard"
 */
function normalizeSlug(slug: string): string {
    return slug
        .split('?')[0]           // Quitar query params
        .replace(/^\/|\/$/g, '') // Quitar slashes inicio/final
        .replace(/^es\//, '')    // Quitar prefijo español
        .replace(/^en\//, '')    // Quitar prefijo inglés
        .replace(/_/g, '/');     // Convertir underscores a slashes
}

/**
 * Formatea un slug como título legible
 */
function formatSlugAsTitle(slug: string): string {
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Extrae el nombre del curso desde una ruta de academia
 * Ej: "academy/my-courses/master-archicad/content" → "Master ArchiCAD"
 */
function extractCourseName(normalized: string): string | null {
    // Patrones: academy/courses/[slug], academy/my-courses/[slug], academy/my-courses/[slug]/content, etc.
    const coursePatterns = [
        /^academy\/courses\/([^\/]+)/,
        /^academy\/my-courses\/([^\/]+)/,
    ];

    for (const pattern of coursePatterns) {
        const match = normalized.match(pattern);
        if (match && match[1]) {
            const courseSlug = match[1];
            // Buscar nombre conocido o formatear el slug
            return COURSE_NAME_MAP[courseSlug] || formatSlugAsTitle(courseSlug);
        }
    }
    return null;
}

/**
 * Traduce un slug de página a un nombre legible.
 * 
 * @example
 * getViewName("es/organization_dashboard") // → "Dashboard"
 * getViewName("academy/my-courses/master-archicad/content") // → "Master ArchiCAD"
 * getViewName(null) // → "Navegando"
 */
export function getViewName(slug: string | null | undefined): string {
    if (!slug) return 'Navegando';

    const normalized = normalizeSlug(slug);

    // Buscar coincidencia exacta
    if (VIEW_NAME_MAP[normalized]) {
        return VIEW_NAME_MAP[normalized];
    }

    // Para cursos específicos de academia, extraer el nombre del curso
    const courseName = extractCourseName(normalized);
    if (courseName) {
        return courseName;
    }

    // Buscar coincidencias parciales para rutas dinámicas
    if (normalized.includes('project/')) return 'Detalle Proyecto';
    if (normalized.includes('academy/')) return 'Academia';
    if (normalized.includes('admin/')) return 'Admin';
    if (normalized.includes('organization/')) return 'Dashboard';

    // Fallback: formatear el slug como título
    return normalized
        .replace(/\//g, ' › ')
        .replace(/\b\w/g, c => c.toUpperCase()) || 'Inicio';
}
