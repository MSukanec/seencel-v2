import { getCourseBySlug, getUserEnrollments } from "@/actions/courses";
import { notFound, redirect } from "next/navigation";
import { StudentCourseTabs } from "@/features/academy/components/student-course-tabs";
import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/layout";
import { Video, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface CourseLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string; locale: string }>;
}

export default async function StudentCourseLayout({ children, params }: CourseLayoutProps) {
    const { slug, locale } = await params;

    // Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
        // Not enrolled - redirect to course landing
        redirect(`/${locale}/academy/courses/${slug}`);
    }

    return (
        <PageWrapper
            type="page"
            title={course.title}
            icon={<Video />}
            tabs={<StudentCourseTabs courseSlug={slug} />}
            backButton={
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                    <Link href="/academy/my-courses">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            }
        >
            {/* Wide layout - no max-width constraint */}
            <div className="h-full overflow-auto">
                {children}
            </div>
        </PageWrapper>
    );
}
