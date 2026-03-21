import { getCourseBySlug, getUserEnrollments } from "@/features/academy/student-actions";
import { notFound, redirect } from "next/navigation";
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

    const routeTabs = [
        { value: "overview", label: "Visión General", href: `/academy/my-courses/${slug}` },
        { value: "player", label: "Reproductor", href: `/academy/my-courses/${slug}/player` },
        { value: "content", label: "Contenido", href: `/academy/my-courses/${slug}/content` },
        { value: "notes", label: "Apuntes", href: `/academy/my-courses/${slug}/notes` },
        { value: "forum", label: "Foro", href: `/academy/my-courses/${slug}/forum` },
        { value: "certificate", label: "Certificado", href: `/academy/my-courses/${slug}/certificate` },
    ];

    return (
        <PageWrapper
            title={course.title}
            parentLabel="Academia"
            backButton={
                <BackButton fallbackHref="/academy/my-courses" />
            }
            routeTabs={routeTabs}
        >
            {/* Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </PageWrapper>
    );
}
