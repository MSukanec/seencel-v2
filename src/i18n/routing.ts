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
        '/finance': {
            en: '/finance',
            es: '/finanzas'
        },
        '/learnings': {
            en: '/learnings',
            es: '/aprendizajes'
        },
        '/learnings/courses': {
            en: '/learnings/courses',
            es: '/aprendizajes/cursos'
        },
        '/learnings/courses/[slug]': {
            en: '/learnings/courses/[slug]',
            es: '/aprendizajes/cursos/[slug]'
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
        // Setup catch-all if needed, but for now specific routes
        '/login': '/login',
        '/signup': '/signup',
        '/admin': '/admin'
    }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
