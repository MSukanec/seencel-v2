import {
    getCourseBySlug,
    getCourseContent,
    getCourseOverviewData,
    getUserLessonSummariesWithDetails,
    getLatestUserMarkersWithDetails
} from "@/features/academy/student-actions";
import { getForumThreads } from "@/actions/forum";
import { CourseOverviewView } from "@/features/academy/views";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function CourseOverviewPage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    // Fetch all data in parallel
    const [modules, overviewData, threads, summaries, markers] = await Promise.all([
        getCourseContent(course.id),
        getCourseOverviewData(course.id),
        getForumThreads(course.id),
        getUserLessonSummariesWithDetails(course.id),
        getLatestUserMarkersWithDetails(course.id, 3)
    ]);

    return (
        <CourseOverviewView
            course={course}
            modules={modules}
            courseSlug={slug}
            overviewData={overviewData}
            latestThreads={threads.slice(0, 3)}
            latestSummaries={summaries.slice(0, 3)}
            latestMarkers={markers}
        />
    );
}
