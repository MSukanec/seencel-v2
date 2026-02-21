import { getCourseBySlug, getCourseContent, getUserLessonMarkers, getUserLessonProgress, getLastViewedLesson, getUserLessonSummaries } from "@/features/academy/student-actions";
import { CoursePlayerView } from "@/features/academy/views";
import { LessonMarker, LessonProgress, LessonNote } from "@/features/academy/types";
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
    // Determine initial lesson logic:
    // 1. If we have a last viewed lesson AND it is NOT completed, resume there.
    // 2. If last viewed is completed (or doesn't exist), find the FIRST UNCOMPLETED lesson.
    // 3. Fallback to first lesson ever.

    const completedSet = new Set(progress.filter(p => p.is_completed).map(p => p.lesson_id));

    // Sort modules and lessons to ensure correct order
    const sortedModules = [...modules].sort((a, b) => a.sort_index - b.sort_index);
    const allLessons = sortedModules.flatMap(m =>
        [...m.lessons].sort((a, b) => a.sort_index - b.sort_index)
    );

    let targetLessonId = lastViewed?.lesson_id;
    let targetPosition = lastViewed?.last_position_sec;

    // Check if last viewed is completed
    if (targetLessonId && completedSet.has(targetLessonId)) {
        // If completed, finding the next uncompleted lesson is better
        targetLessonId = undefined;
        targetPosition = 0;
    }

    // If no target yet (or it was completed), find first uncompleted
    if (!targetLessonId) {
        const firstUncompleted = allLessons.find(l => !completedSet.has(l.id));
        if (firstUncompleted) {
            targetLessonId = firstUncompleted.id;
            targetPosition = 0;
        } else if (allLessons.length > 0) {
            // All completed? Start from beginning or stay at last? 
            // Usually start from beginning is safer replay behavior, or just first lesson.
            targetLessonId = allLessons[0].id;
        }
    }

    return (
        <CoursePlayerView
            course={course}
            modules={modules}
            markers={markers as LessonMarker[]}
            progress={progress as LessonProgress[]}
            summaries={summaries as LessonNote[]}
            initialLessonId={targetLessonId}
            initialPositionSec={targetPosition}
        />
    );
}
