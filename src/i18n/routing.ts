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
        
        // ===== UNIFIED SETTINGS PORTAL =====
        '/settings': {
            en: '/settings',
            es: '/configuracion'
        },
        '/settings/profile': {
            en: '/settings/profile',
            es: '/configuracion/perfil'
        },
        '/settings/organizations': {
            en: '/settings/organizations',
            es: '/configuracion/organizaciones'
        },
        '/settings/security': {
            en: '/settings/security',
            es: '/configuracion/seguridad'
        },
        '/settings/billing': {
            en: '/settings/billing',
            es: '/configuracion/facturacion'
        },
        '/settings/notifications': {
            en: '/settings/notifications',
            es: '/configuracion/notificaciones'
        },
        '/settings/preferences': {
            en: '/settings/preferences',
            es: '/configuracion/preferencias'
        },
        '/settings/organization': {
            en: '/settings/organization',
            es: '/configuracion/organizacion'
        },
        '/settings/members': {
            en: '/settings/members',
            es: '/configuracion/miembros'
        },
        '/settings/permissions': {
            en: '/settings/permissions',
            es: '/configuracion/permisos'
        },
        '/settings/activity': {
            en: '/settings/activity',
            es: '/configuracion/actividad'
        },
        '/settings/projects': {
            en: '/settings/projects',
            es: '/configuracion/proyectos'
        },
        '/settings/contacts': {
            en: '/settings/contacts',
            es: '/configuracion/contactos'
        },
        '/settings/files': {
            en: '/settings/files',
            es: '/configuracion/archivos'
        },
        '/settings/finance': {
            en: '/settings/finance',
            es: '/configuracion/finanzas'
        },
        '/settings/templates': {
            en: '/settings/templates',
            es: '/configuracion/plantillas'
        },
        '/settings/units': {
            en: '/settings/units',
            es: '/configuracion/unidades'
        },
        '/settings/personal-billing': {
            en: '/settings/personal-billing',
            es: '/configuracion/facturacion-personal'
        },
        '/settings/location': {
            en: '/settings/location',
            es: '/configuracion/ubicacion'
        },
        // ===================================
        '/profile': {
            en: '/profile',
            es: '/perfil'
        },
        '/profile/organizations': {
            en: '/profile/organizations',
            es: '/perfil/organizaciones'
        },
        '/profile/security': {
            en: '/profile/security',
            es: '/perfil/seguridad'
        },
        '/profile/billing': {
            en: '/profile/billing',
            es: '/perfil/facturacion'
        },
        '/profile/notifications': {
            en: '/profile/notifications',
            es: '/perfil/notificaciones'
        },
        '/profile/preferences': {
            en: '/profile/preferences',
            es: '/perfil/preferencias'
        },
        '/notifications': {
            en: '/notifications',
            es: '/notificaciones'
        },
        '/organization/projects': {
            en: '/organization/projects',
            es: '/organizacion/proyectos'
        },
        '/organization/projects/[projectId]': {
            en: '/organization/projects/[projectId]',
            es: '/organizacion/proyectos/[projectId]'
        },
        '/organization/projects/settings': {
            en: '/organization/projects/settings',
            es: '/organizacion/proyectos/ajustes'
        },
        '/organization/projects/location': {
            en: '/organization/projects/location',
            es: '/organizacion/proyectos/ubicacion'
        },

        '/organization/settings': {
            en: '/organization/settings',
            es: '/organizacion/configuracion'
        },
        '/organization/settings/members': {
            en: '/organization/settings/members',
            es: '/organizacion/configuracion/miembros'
        },
        '/organization/settings/permissions': {
            en: '/organization/settings/permissions',
            es: '/organizacion/configuracion/permisos'
        },
        '/organization/settings/location': {
            en: '/organization/settings/location',
            es: '/organizacion/configuracion/ubicacion'
        },
        '/organization/settings/billing': {
            en: '/organization/settings/billing',
            es: '/organizacion/configuracion/facturacion'
        },
        '/organization/settings/finance': {
            en: '/organization/settings/finance',
            es: '/organizacion/configuracion/finanzas'
        },
        '/organization/settings/activity': {
            en: '/organization/settings/activity',
            es: '/organizacion/configuracion/actividad'
        },


        '/organization/contacts': {
            en: '/organization/contacts',
            es: '/organizacion/contactos'
        },
        '/organization/contacts/categories': {
            en: '/organization/contacts/categories',
            es: '/organizacion/contactos/categorias'
        },
        '/organization/team': {
            en: '/organization/team',
            es: '/organizacion/equipo'
        },
        "/admin/academy": {
            es: "/admin/academia",
            en: "/admin/academy"
        },
        "/admin/academy/students": {
            es: "/admin/academia/alumnos",
            en: "/admin/academy/students"
        },
        "/admin/academy/courses": {
            es: "/admin/academia/cursos",
            en: "/admin/academy/courses"
        },
        "/admin/academy/instructors": {
            es: "/admin/academia/instructores",
            en: "/admin/academy/instructors"
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
        "/academy/my-courses/[slug]/content": {
            es: "/academia/mis-cursos/[slug]/contenido",
            en: "/academy/my-courses/[slug]/content"
        },
        "/academy/my-courses/[slug]/notes": {
            es: "/academia/mis-cursos/[slug]/notas",
            en: "/academy/my-courses/[slug]/notes"
        },
        "/academy/my-courses/[slug]/forum": {
            es: "/academia/mis-cursos/[slug]/foro",
            en: "/academy/my-courses/[slug]/forum"
        },
        "/academy/my-courses/[slug]/certificate": {
            es: "/academia/mis-cursos/[slug]/certificado",
            en: "/academy/my-courses/[slug]/certificate"
        },


        '/organization/finance': {
            en: '/organization/finance',
            es: '/organizacion/finanzas'
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
        '/organization/catalog/tasks': {
            en: '/organization/catalog/tasks',
            es: '/organizacion/catalogo/tareas'
        },
        '/organization/catalog/tasks/divisions': {
            en: '/organization/catalog/tasks/divisions',
            es: '/organizacion/catalogo/tareas/rubros'
        },

        // ===== Organization Planner =====
        '/organization/planner': {
            en: '/organization/planner',
            es: '/organizacion/planificador'
        },

        // ===== Organization Files =====
        '/organization/files': {
            en: '/organization/files',
            es: '/organizacion/archivos'
        },
        '/organization/files/settings': {
            en: '/organization/files/settings',
            es: '/organizacion/archivos/ajustes'
        },

        // ===== Organization Quotes =====
        '/organization/quotes': {
            en: '/organization/quotes',
            es: '/organizacion/cotizaciones'
        },
        '/organization/quotes/[quoteId]': {
            en: '/organization/quotes/[quoteId]',
            es: '/organizacion/cotizaciones/[quoteId]'
        },

        // ===== Organization General Costs =====
        '/organization/general-costs': {
            en: '/organization/general-costs',
            es: '/organizacion/gastos-generales'
        },
        '/organization/general-costs/payments': {
            en: '/organization/general-costs/payments',
            es: '/organizacion/gastos-generales/pagos'
        },
        '/organization/general-costs/concepts': {
            en: '/organization/general-costs/concepts',
            es: '/organizacion/gastos-generales/conceptos'
        },
        '/organization/general-costs/settings': {
            en: '/organization/general-costs/settings',
            es: '/organizacion/gastos-generales/ajustes'
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

        '/organization/health': {
            en: '/organization/health',
            es: '/organizacion/salud'
        },
        '/organization/sitelog': {
            en: '/organization/sitelog',
            es: '/organizacion/bitacora'
        },
        '/organization/sitelog/settings': {
            en: '/organization/sitelog/settings',
            es: '/organizacion/bitacora/ajustes'
        },

        // ===== External Actor Routes =====
        '/organization/external/client': {
            en: '/organization/external/client',
            es: '/organizacion/externo/cliente'
        },

        // ===== Project Routes =====
        '/project/[projectId]/details': {
            en: '/project/[projectId]/details',
            es: '/proyecto/[projectId]/detalles'
        },

        '/project/[projectId]/subcontracts': {
            en: '/project/[projectId]/subcontracts',
            es: '/proyecto/[projectId]/subcontratos'
        },
        '/project/[projectId]/subcontracts/[subcontractId]': {
            en: '/project/[projectId]/subcontracts/[subcontractId]',
            es: '/proyecto/[projectId]/subcontratos/[subcontractId]'
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
        '/founders/program': {
            en: '/founders/program',
            es: '/fundadores/programa'
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
        '/workspace-setup': {
            en: '/workspace-setup',
            es: '/configurar-espacio'
        },
        '/admin': '/admin',
        // Admin hub content
        '/admin/hub-content': '/admin/hub-content',
        '/admin/emails': '/admin/emails',
        '/admin/catalog': '/admin/catalog',
        '/admin/catalog/task/[taskId]': '/admin/catalog/task/[taskId]',
        '/admin/catalog/division/[divisionId]': '/admin/catalog/division/[divisionId]',
        '/admin/catalog/element/[elementId]': '/admin/catalog/element/[elementId]',
        // Admin Directory
        '/admin/directory': '/admin/directory',
        '/admin/directory/[userId]': '/admin/directory/[userId]',
        '/admin/directory/organizations/[orgId]': '/admin/directory/organizations/[orgId]',

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

