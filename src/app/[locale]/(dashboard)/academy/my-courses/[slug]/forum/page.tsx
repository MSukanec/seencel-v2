import { getCourseBySlug } from "@/features/academy/student-actions";
import { getForumCategories, getForumThreads } from "@/actions/forum";
import { CourseForumView } from "@/features/academy/views";
import { getAuthUser } from "@/lib/auth";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => ({
    title: 'Foro del Curso | Seencel',
    robots: 'noindex, nofollow',
});

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function CourseForumPage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    // Fetch forum data for this course
    const [categories, threads] = await Promise.all([
        getForumCategories(course.id),
        getForumThreads(course.id),
    ]);

    // Get current user ID
    const authUser = await getAuthUser();

    return (
        <CourseForumView
            courseId={course.id}
            courseSlug={slug}
            categories={categories}
            threads={threads}
            currentUserId={authUser?.id}
        />
    );
}
