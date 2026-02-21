import { getCourseBySlug } from "@/features/academy/student-actions";
import { getForumCategories, getForumThreads } from "@/actions/forum";
import { CourseForumView } from "@/features/academy/views";
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <CourseForumView
            courseId={course.id}
            courseSlug={slug}
            categories={categories}
            threads={threads}
            currentUserId={user?.id}
        />
    );
}
