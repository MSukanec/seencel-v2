import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['es', 'en'],

    // Used when no locale matches
    defaultLocale: 'es',

    pathnames: {
        '/': '/',
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
        '/organization/settings': {
            en: '/organization/settings',
            es: '/organizacion/configuracion'
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
        '/organization/billing/plans': {
            en: '/organization/billing/plans',
            es: '/organizacion/facturacion/planes'
        },
        '/organization/finance': {
            en: '/organization/finance',
            es: '/organizacion/finanzas'
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

        '/organization/billing/founders': {
            en: '/organization/billing/founders',
            es: '/organizacion/facturacion/fundadores'
        },
        '/organization/billing/checkout': {
            en: '/organization/billing/checkout',
            es: '/organizacion/facturacion/checkout'
        },
        '/privacy': {
            en: '/privacy',
            es: '/privacidad'
        },
        // Setup catch-all if needed, but for now specific routes
        '/login': '/login',
        '/signup': '/signup',
        '/forgot-password': '/forgot-password',
        '/admin': '/admin'
    }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);

