import type { Metadata } from "next";
import { getCourses, getUserEnrollments, getCoursesWithProgress } from "@/features/academy/student-actions";
import { CoursesContent } from "@/features/academy/components/courses-content";
import { PageWrapper } from "@/components/layout";
import { Video } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from 'next-intl/server';

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
        robots: "noindex, nofollow", // 🔒 Dashboard siempre privado
    };
}

export default async function MyCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Learning' });

    // Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const [courses, enrolledCourseIds, startedCourseIds] = await Promise.all([
        getCourses(),
        getUserEnrollments(),
        getCoursesWithProgress(),
    ]);

    return (
        <PageWrapper type="page" title={t('myCourses')} icon={<Video />}>
            <CoursesContent
                courses={courses}
                detailRoute="/academy/courses"
                isDashboard={true}
                enrolledCourseIds={Array.from(enrolledCourseIds)}
                startedCourseIds={Array.from(startedCourseIds)}
            />
        </PageWrapper>
    );
}
