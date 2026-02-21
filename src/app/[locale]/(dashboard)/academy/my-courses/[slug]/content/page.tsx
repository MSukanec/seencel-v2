import { getCourseBySlug, getCourseContent } from "@/features/academy/student-actions";
import { CourseContentView } from "@/features/academy/views";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";

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

    const modules = await getCourseContent(course.id);

    // TODO: Fetch completed lesson IDs from database

    return (
        <CourseContentView
            modules={modules}
            courseSlug={slug}
        />
    );
}
