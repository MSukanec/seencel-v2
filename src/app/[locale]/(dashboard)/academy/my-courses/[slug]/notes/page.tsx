import { getCourseBySlug, getUserLessonSummariesWithDetails } from "@/features/academy/student-actions";
import { CourseNotesView } from "@/features/academy/views";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => ({
    title: 'Apuntes del Curso | Seencel',
    robots: 'noindex, nofollow',
});

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function CourseNotesPage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    const summaries = await getUserLessonSummariesWithDetails(course.id);

    return (
        <CourseNotesView
            courseId={course.id}
            courseSlug={slug}
            summaries={summaries}
        />
    );
}
