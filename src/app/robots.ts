import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    // Dashboard routes (English)
                    '/hub/',
                    '/organization/',
                    '/project/',
                    '/admin/',
                    '/profile/',
                    '/onboarding/',
                    '/checkout/',
                    '/api/',
                    // Dashboard routes (Spanish - localized)
                    '/es/hub/',
                    '/es/organizacion/',
                    '/es/proyecto/',
                    '/es/admin/',
                    '/es/perfil/',
                    '/es/bienvenida/',
                    '/es/checkout/',
                    '/en/hub/',
                    '/en/organization/',
                    '/en/project/',
                    '/en/admin/',
                    '/en/profile/',
                    '/en/onboarding/',
                    '/en/checkout/',
                ],
            },
        ],
        sitemap: 'https://seencel.com/sitemap.xml',
    }
}
