import { getCourseBySlug, getCourseContent, getUserLessonMarkers, getUserLessonProgress, getLastViewedLesson, getUserLessonSummaries } from "@/actions/courses";
import { CoursePlayerView } from "@/features/academy/views";
import { LessonMarker, LessonProgress, LessonNote } from "@/types/courses";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function CoursePlayerPage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    const [modules, markers, progress, lastViewed, summaries] = await Promise.all([
        getCourseContent(course.id),
        getUserLessonMarkers(course.id),
        getUserLessonProgress(course.id),
        getLastViewedLesson(course.id),
        getUserLessonSummaries(course.id)
    ]);

    // Determine initial lesson and position for resume
    const initialLessonId = lastViewed?.lesson_id;
    const initialPositionSec = lastViewed?.last_position_sec;

    return (
        <CoursePlayerView
            course={course}
            modules={modules}
            markers={markers as LessonMarker[]}
            progress={progress as LessonProgress[]}
            summaries={summaries as LessonNote[]}
            initialLessonId={initialLessonId}
            initialPositionSec={initialPositionSec}
        />
    );
}
