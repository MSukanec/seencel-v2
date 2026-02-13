import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['es', 'en'],

    // Used when no locale matches
    defaultLocale: 'es',

    pathnames: {
        '/': '/',
        '/hub': {
            en: '/hub',
            es: '/hub'
        },
        '/organization': {
            en: '/organization',
            es: '/organizacion'
        },
        '/settings': {
            en: '/settings',
            es: '/configuracion'
        },
        '/profile': {
            en: '/profile',
            es: '/perfil'
        },
        '/organization/projects': {
            en: '/organization/projects',
            es: '/organizacion/proyectos'
        },

        '/organization/identity': {
            en: '/organization/identity',
            es: '/organizacion/identidad'
        },
        '/organization/contacts': {
            en: '/organization/contacts',
            es: '/organizacion/contactos'
        },
        '/organization/team': {
            en: '/organization/team',
            es: '/organizacion/equipo'
        },
        "/academy": {
            es: "/academia",
            en: "/academy"
        },
        "/academy/courses": {
            es: "/academia/cursos",
            en: "/academy/courses"
        },
        "/academy/courses/[slug]": {
            es: "/academia/cursos/[slug]",
            en: "/academy/courses/[slug]"
        },
        // Academy Dashboard (Student)
        "/academy/my-courses": {
            es: "/academia/mis-cursos",
            en: "/academy/my-courses"
        },
        "/academy/my-courses/[slug]": {
            es: "/academia/mis-cursos/[slug]",
            en: "/academy/my-courses/[slug]"
        },
        "/academy/my-courses/[slug]/player": {
            es: "/academia/mis-cursos/[slug]/reproductor",
            en: "/academy/my-courses/[slug]/player"
        },
        "/academy/my-courses/[slug]/notes": {
            es: "/academia/mis-cursos/[slug]/notas",
            en: "/academy/my-courses/[slug]/notes"
        },
        "/academy/my-courses/[slug]/forum": {
            es: "/academia/mis-cursos/[slug]/foro",
            en: "/academy/my-courses/[slug]/forum"
        },


        '/organization/finance': {
            en: '/organization/finance',
            es: '/organizacion/finanzas'
        },
        '/organization/capital': {
            en: '/organization/capital',
            es: '/organizacion/capital'
        },
        '/organization/advanced': {
            en: '/organization/advanced',
            es: '/organizacion/avanzado'
        },
        '/organization/reports': {
            en: '/organization/reports',
            es: '/organizacion/informes'
        },

        // ===== Organization Catalog (Technical) =====
        '/organization/catalog': {
            en: '/organization/catalog',
            es: '/organizacion/catalogo'
        },
        '/organization/catalog/task/[taskId]': {
            en: '/organization/catalog/task/[taskId]',
            es: '/organizacion/catalogo/tarea/[taskId]'
        },

        // ===== Organization Planner =====
        '/organization/planner': {
            en: '/organization/planner',
            es: '/organizacion/planificador'
        },

        // ===== Organization Files =====
        '/organization/files': {
            en: '/organization/files',
            es: '/organizacion/documentacion'
        },

        // ===== Organization Quotes =====
        '/organization/quotes': {
            en: '/organization/quotes',
            es: '/organizacion/cotizaciones'
        },

        // ===== Organization General Costs =====
        '/organization/general-costs': {
            en: '/organization/general-costs',
            es: '/organizacion/gastos-generales'
        },

        // ===== Organization Pages (migrated from /project/) =====
        '/organization/construction-tasks': {
            en: '/organization/construction-tasks',
            es: '/organizacion/tareas-obra'
        },
        '/organization/materials': {
            en: '/organization/materials',
            es: '/organizacion/materiales'
        },
        '/organization/labor': {
            en: '/organization/labor',
            es: '/organizacion/mano-de-obra'
        },
        '/organization/subcontracts': {
            en: '/organization/subcontracts',
            es: '/organizacion/subcontratos'
        },
        '/organization/clients': {
            en: '/organization/clients',
            es: '/organizacion/clientes'
        },
        '/organization/portal': {
            en: '/organization/portal',
            es: '/organizacion/portal'
        },
        '/organization/health': {
            en: '/organization/health',
            es: '/organizacion/salud'
        },
        '/organization/sitelog': {
            en: '/organization/sitelog',
            es: '/organizacion/bitacora'
        },

        // ===== Project Routes =====
        '/project/[projectId]/details': {
            en: '/project/[projectId]/details',
            es: '/proyecto/[projectId]/detalles'
        },
        '/project/[projectId]/construction-tasks': {
            en: '/project/[projectId]/construction-tasks',
            es: '/proyecto/[projectId]/tareas-obra'
        },
        '/project/[projectId]/materials': {
            en: '/project/[projectId]/materials',
            es: '/proyecto/[projectId]/materiales'
        },
        '/project/[projectId]/labor': {
            en: '/project/[projectId]/labor',
            es: '/proyecto/[projectId]/mano-de-obra'
        },
        '/project/[projectId]/subcontracts': {
            en: '/project/[projectId]/subcontracts',
            es: '/proyecto/[projectId]/subcontratos'
        },
        '/project/[projectId]/subcontracts/[subcontractId]': {
            en: '/project/[projectId]/subcontracts/[subcontractId]',
            es: '/proyecto/[projectId]/subcontratos/[subcontractId]'
        },
        '/project/[projectId]/finance': {
            en: '/project/[projectId]/finance',
            es: '/proyecto/[projectId]/finanzas'
        },
        '/project/[projectId]/health': {
            en: '/project/[projectId]/health',
            es: '/proyecto/[projectId]/salud'
        },
        '/project/[projectId]/sitelog': {
            en: '/project/[projectId]/sitelog',
            es: '/proyecto/[projectId]/bitacora'
        },
        '/project/[projectId]/quotes': {
            en: '/project/[projectId]/quotes',
            es: '/proyecto/[projectId]/cotizaciones'
        },
        '/project/[projectId]/clients': {
            en: '/project/[projectId]/clients',
            es: '/proyecto/[projectId]/clientes'
        },
        '/project/[projectId]/portal': {
            en: '/project/[projectId]/portal',
            es: '/proyecto/[projectId]/portal'
        },

        '/contact': {
            en: '/contact',
            es: '/contacto'
        },
        '/features': {
            en: '/features',
            es: '/caracteristicas'
        },
        '/pricing': {
            en: '/pricing',
            es: '/precios'
        },
        '/founders': {
            en: '/founders',
            es: '/fundadores'
        },


        '/checkout': {
            en: '/checkout',
            es: '/checkout'
        },
        '/privacy': {
            en: '/privacy',
            es: '/privacidad'
        },
        '/terms': {
            en: '/terms',
            es: '/terminos'
        },
        // Setup catch-all if needed, but for now specific routes
        '/login': '/login',
        '/signup': '/signup',
        '/forgot-password': '/forgot-password',
        '/community': {
            en: '/community',
            es: '/comunidad'
        },
        '/onboarding': {
            en: '/onboarding',
            es: '/bienvenida'
        },
        '/admin': '/admin',
        // Admin hub content
        '/admin/hub-content': '/admin/hub-content',
        '/admin/emails': '/admin/emails',
        '/admin/catalog': '/admin/catalog',
        '/admin/catalog/task/[taskId]': '/admin/catalog/task/[taskId]',
        '/admin/catalog/division/[divisionId]': '/admin/catalog/division/[divisionId]',
        '/admin/catalog/element/[elementId]': '/admin/catalog/element/[elementId]',

        // ===== Documentation =====
        '/docs': {
            en: '/docs',
            es: '/docs'
        },

        // ===== Invitations =====
        '/invite/accept': {
            en: '/invite/accept',
            es: '/invitacion/aceptar'
        },
    }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);

