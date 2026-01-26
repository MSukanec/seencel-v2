import { getCourses, getUserEnrollments } from "@/actions/courses";
import { CoursesContent } from "@/features/academy/components/courses-content";
import { PageWrapper } from "@/components/layout";
import { Video } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale } from 'next-intl/server';

export default async function MyCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const courses = await getCourses();
    const enrolledCourseIds = await getUserEnrollments();

    return (
        <PageWrapper type="page" title="Mis Cursos" icon={<Video />}>
            <div className="container mx-auto p-6 max-w-7xl">
                <CoursesContent
                    courses={courses}
                    detailRoute="/academy"
                    isDashboard={true}
                    enrolledCourseIds={Array.from(enrolledCourseIds)}
                />
            </div>
        </PageWrapper>
    );
}
