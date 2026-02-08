import { getUserProfile } from "@/features/users/queries";
import { ContactPageView } from "@/features/landing/views/contact-page-view";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import type { Metadata } from 'next';

const BASE_URL = 'https://seencel.com';

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const isEs = locale === 'es';

    return {
        title: isEs ? 'Contacto | SEENCEL' : 'Contact | SEENCEL',
        description: isEs
            ? 'Ponete en contacto con el equipo de Seencel. Estamos para ayudarte con cualquier consulta sobre gestión de construcción.'
            : 'Get in touch with the Seencel team. We are here to help you with any questions about construction management.',
        openGraph: {
            title: isEs ? 'Contacto | SEENCEL' : 'Contact | SEENCEL',
            description: isEs
                ? 'Ponete en contacto con el equipo de Seencel.'
                : 'Get in touch with the Seencel team.',
            url: isEs ? `${BASE_URL}/es/contacto` : `${BASE_URL}/en/contact`,
            siteName: 'SEENCEL',
            images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'SEENCEL' }],
            locale: isEs ? 'es_AR' : 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: isEs ? 'Contacto | SEENCEL' : 'Contact | SEENCEL',
            images: [`${BASE_URL}/og-image.jpg`],
        },
        alternates: {
            canonical: isEs ? `${BASE_URL}/es/contacto` : `${BASE_URL}/en/contact`,
            languages: {
                'es': `${BASE_URL}/es/contacto`,
                'en': `${BASE_URL}/en/contact`,
            },
        },
        robots: { index: true, follow: true },
    };
}

export default async function ContactPage() {
    const { profile } = await getUserProfile();

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1 pt-20">
                <ContactPageView />
            </main>
            <Footer />
        </div>
    );
}


