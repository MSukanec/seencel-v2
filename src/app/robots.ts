import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/hub/',
                    '/organization/',
                    '/project/',
                    '/admin/',
                    '/settings/',
                    '/profile/',
                    '/onboarding/',
                    '/checkout/',
                    '/api/',
                ],
            },
        ],
        sitemap: 'https://seencel.com/sitemap.xml',
    }
}
