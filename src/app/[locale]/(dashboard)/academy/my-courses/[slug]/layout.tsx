import { getCourseBySlug, getUserEnrollments } from "@/features/academy/student-actions";
import { notFound, redirect } from "next/navigation";
import { StudentCourseTabs } from "@/features/academy/components/student-course-tabs";
import { getAuthUser } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { BackButton } from "@/components/shared/back-button";

interface CourseLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string; locale: string }>;
}

export default async function StudentCourseLayout({ children, params }: CourseLayoutProps) {
    const { slug } = await params;

    // Auth already handled by parent academy/layout.tsx
    const authUser = await getAuthUser();
    if (!authUser) {
        redirect('/auth/login');
    }

    const course = await getCourseBySlug(slug);

    if (!course) {
        notFound();
    }

    // Check if user is enrolled
    const enrolledCourseIds = await getUserEnrollments();
    const isEnrolled = enrolledCourseIds.has(course.id);

    if (!isEnrolled) {
        redirect(`/academy/courses/${slug}`);
    }

    return (
        <PageWrapper
            title={course.title}
            parentLabel="Academia"
            backButton={
                <BackButton fallbackHref="/academy/my-courses" />
            }
        >
            {/* Course tabs navigation via Portal */}
            <StudentCourseTabs courseSlug={slug} />

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </PageWrapper>
    );
}
