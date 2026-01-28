import { MetadataRoute } from 'next'

const BASE_URL = 'https://seencel.com'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        // Landing pages
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${BASE_URL}/es`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${BASE_URL}/en`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        // Pricing
        {
            url: `${BASE_URL}/es/precios`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/en/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        // Features
        {
            url: `${BASE_URL}/es/caracteristicas`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/en/features`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        // Contact
        {
            url: `${BASE_URL}/es/contacto`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/en/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
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
        // Auth (public but low priority)
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/signup`,
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
        },
        {
            url: `${BASE_URL}/en/academy/courses`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]
}
