import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
    getGlobalAcademyOverviewData, 
    getRecentLessons, 
    getCourses, 
    getUserEnrollments, 
    getCoursesWithProgress 
} from "@/features/academy/student-actions";
import { ContentLayout, PageWrapper } from "@/components/layout";
import { AcademyDashboardView } from "@/features/academy/components/overview/academy-dashboard-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { GraduationCap } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
    title: "Academia - Visión General",
    robots: "noindex, nofollow",
};

export default async function AcademyOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // 1. Resolve Auth (from central cache)
    const user = await getAuthUser();
    if (!user) {
        redirect("/login");
    }

    try {
        // 2. Fetch everything in parallel
        const [
            globalStats,
            recentLessons,
            allCourses,
            enrolledSet,
            startedSet
        ] = await Promise.all([
            getGlobalAcademyOverviewData(),
            getRecentLessons(4),
            getCourses(),
            getUserEnrollments(),
            getCoursesWithProgress()
        ]);

        // Convert Sets to Arrays for passing to client components
        const enrolledCourseIds = Array.from(enrolledSet);
        const startedCourseIds = Array.from(startedSet);

        // Filter active courses: only courses where the user is enrolled or has progress
        const activeCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id) || startedCourseIds.includes(c.id));
        
        // El último curso publicado (ya vienen ordenados por created_at descending)
        const latestCourse = allCourses.find(c => c.visibility === 'public') || null;

        return (
            <PageWrapper title="Academia" icon={<GraduationCap />}>
                <ContentLayout variant="wide">
                    <div className="space-y-8 mt-2">
                        {/* Dashboard Analytics & Courses */}
                        <AcademyDashboardView
                            latestCourse={latestCourse}
                            globalStats={globalStats}
                            recentLessons={recentLessons}
                            activeCourses={activeCourses}
                            enrolledCourseIds={enrolledCourseIds}
                            startedCourseIds={startedCourseIds}
                            isPurchaseEnabled={false} // Currently we don't have purchase flow integrated here
                        />
                    </div>
                </ContentLayout>
            </PageWrapper>
        );
    } catch {
        return (
            <PageWrapper title="Academia" icon={<GraduationCap />}>
                <ContentLayout variant="wide">
                    <ErrorDisplay
                        title="Error al cargar la Visión General"
                        message="No pudimos cargar tu panel interactivo de la Academia. Intentá de nuevo."
                        retryLabel="Reintentar"
                    />
                </ContentLayout>
            </PageWrapper>
        );
    }
}
