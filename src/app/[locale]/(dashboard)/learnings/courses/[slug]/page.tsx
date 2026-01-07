import { getCourseBySlug, getCourseContent } from "@/actions/courses";
import { notFound } from "next/navigation";
import { CourseViewClient } from "@/components/courses/course-view-client";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function CoursePage({ params }: PageProps) {
    const { slug } = await params;
    const course = await getCourseBySlug(slug);

    if (!course) {
        notFound();
    }

    const modules = await getCourseContent(course.id);

    return <CourseViewClient course={course} modules={modules} />;
}
