import type { Metadata } from "next";
import { getCourses, getUserEnrollments, getCoursesWithProgress } from "@/features/academy/student-actions";
import { CoursesContent } from "@/features/academy/components/courses-content";
import { ContentLayout, PageWrapper } from "@/components/layout";
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ErrorDisplay } from "@/components/ui/error-display";
import { Video } from "lucide-react";

// ✅ METADATA OBLIGATORIA
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Learning' });
    return {
        title: `${t('myCourses')} | Seencel`,
        description: t('description'),
        robots: "noindex, nofollow",
    };
}

export default async function MyCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const [courses, enrolledCourseIds, startedCourseIds] = await Promise.all([
            getCourses(),
            getUserEnrollments(),
            getCoursesWithProgress(),
        ]);

        const t = await getTranslations({ locale, namespace: 'Learning' });

        return (
            <PageWrapper title={t('myCourses')} icon={<Video />}>
                <ContentLayout variant="wide">
                    <CoursesContent
                        courses={courses}
                        detailRoute="/academy/courses"
                        isDashboard={true}
                        enrolledCourseIds={Array.from(enrolledCourseIds)}
                        startedCourseIds={Array.from(startedCourseIds)}
                    />
                </ContentLayout>
            </PageWrapper>
        );
    } catch {
        return (
            <PageWrapper title="Mis Cursos" icon={<Video />}>
                <ContentLayout variant="wide">
                    <ErrorDisplay
                        title="Error al cargar cursos"
                        message="No pudimos cargar los cursos. Intentá de nuevo."
                        retryLabel="Reintentar"
                    />
                </ContentLayout>
            </PageWrapper>
        );
    }
}
