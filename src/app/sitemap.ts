import { MetadataRoute } from 'next'

const BASE_URL = 'https://seencel.com'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        // Landing pages
        {
            url: `${BASE_URL}/es`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es`,
                    en: `${BASE_URL}/en`,
                },
            },
        },
        {
            url: `${BASE_URL}/en`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es`,
                    en: `${BASE_URL}/en`,
                },
            },
        },
        // Pricing
        {
            url: `${BASE_URL}/es/precios`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/precios`,
                    en: `${BASE_URL}/en/pricing`,
                },
            },
        },
        {
            url: `${BASE_URL}/en/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/precios`,
                    en: `${BASE_URL}/en/pricing`,
                },
            },
        },
        // Features
        {
            url: `${BASE_URL}/es/caracteristicas`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/caracteristicas`,
                    en: `${BASE_URL}/en/features`,
                },
            },
        },
        {
            url: `${BASE_URL}/en/features`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/caracteristicas`,
                    en: `${BASE_URL}/en/features`,
                },
            },
        },
        // Contact
        {
            url: `${BASE_URL}/es/contacto`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/contacto`,
                    en: `${BASE_URL}/en/contact`,
                },
            },
        },
        {
            url: `${BASE_URL}/en/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/contacto`,
                    en: `${BASE_URL}/en/contact`,
                },
            },
        },
        // Legal
        {
            url: `${BASE_URL}/es/privacidad`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/es/terminos`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        // Auth (public, with locale)
        {
            url: `${BASE_URL}/es/login`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/es/signup`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        // Academy public catalog
        {
            url: `${BASE_URL}/es/academia/cursos`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/academia/cursos`,
                    en: `${BASE_URL}/en/academy/courses`,
                },
            },
        },
        {
            url: `${BASE_URL}/en/academy/courses`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
            alternates: {
                languages: {
                    es: `${BASE_URL}/es/academia/cursos`,
                    en: `${BASE_URL}/en/academy/courses`,
                },
            },
        },
    ]
}
