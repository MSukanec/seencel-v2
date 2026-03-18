import { getCourseBySlug, getCourseContent, getUserLessonProgress } from "@/features/academy/student-actions";
import { CourseContentView } from "@/features/academy/views";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => ({
    title: 'Contenido del Curso | Seencel',
    robots: 'noindex, nofollow',
});

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function CourseContentPage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    const [modules, progress] = await Promise.all([
        getCourseContent(course.id),
        getUserLessonProgress(course.id)
    ]);

    const completedLessonIds = progress
        .filter(p => p.is_completed)
        .map(p => p.lesson_id);

    return (
        <CourseContentView
            modules={modules}
            courseSlug={slug}
            completedLessonIds={completedLessonIds}
        />
    );
}
