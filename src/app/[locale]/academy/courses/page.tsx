import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { getCourses, getUserEnrollments, getCoursesWithProgress } from "@/features/academy/student-actions";
import { CoursesContent } from "@/features/academy/components/courses-content";
import { getFeatureFlag } from "@/actions/feature-flags";
import type { Metadata } from 'next';

import { setRequestLocale } from 'next-intl/server';

const BASE_URL = 'https://seencel.com';

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const isEs = locale === 'es';

    return {
        title: isEs ? 'Cursos de Construcción | SEENCEL Academia' : 'Construction Courses | SEENCEL Academy',
        description: isEs
            ? 'Aprendé gestión de obras con nuestros cursos online. Presupuestos, planificación, control de obra y más.'
            : 'Learn construction management with our online courses. Budgets, planning, site control and more.',
        openGraph: {
            title: isEs ? 'Cursos de Construcción | SEENCEL' : 'Construction Courses | SEENCEL',
            description: isEs
                ? 'Cursos online de gestión de construcción.'
                : 'Online construction management courses.',
            url: isEs ? `${BASE_URL}/es/academia/cursos` : `${BASE_URL}/en/academy/courses`,
            siteName: 'SEENCEL',
            images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'SEENCEL Academy' }],
            locale: isEs ? 'es_AR' : 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: isEs ? 'Cursos | SEENCEL Academia' : 'Courses | SEENCEL Academy',
            images: [`${BASE_URL}/og-image.jpg`],
        },
        alternates: {
            canonical: isEs ? `${BASE_URL}/es/academia/cursos` : `${BASE_URL}/en/academy/courses`,
            languages: {
                'es': `${BASE_URL}/es/academia/cursos`,
                'en': `${BASE_URL}/en/academy/courses`,
            },
        },
        robots: { index: true, follow: true },
    };
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const [{ profile }, courses, enrolledCourseIds, startedCourseIds, isPurchaseEnabled] = await Promise.all([
        getUserProfile(),
        getCourses(),
        getUserEnrollments(),
        getCoursesWithProgress(),
        getFeatureFlag("course_purchases_enabled")
    ]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header variant="public" user={profile} />

            <main className="flex-1 pt-20">
                <div className="container mx-auto">
                    <CoursesContent
                        courses={courses}
                        detailRoute="/academy/courses"
                        enrolledCourseIds={Array.from(enrolledCourseIds)}
                        startedCourseIds={Array.from(startedCourseIds)}
                        isPurchaseEnabled={isPurchaseEnabled}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}
