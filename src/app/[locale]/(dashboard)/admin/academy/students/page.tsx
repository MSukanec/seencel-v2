import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminCourseEnrollments, getAdminCourses } from "@/features/admin/academy-queries";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { AdminAcademyStudentsView } from "@/features/admin/academy/views";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Admin.academy' });
    return {
        title: `Alumnos | Academia | Seencel Admin`,
        description: "Gestión de alumnos e inscripciones",
        robots: "noindex, nofollow",
    };
}

export default async function AdminAcademyStudentsPage() {
    try {
        const [enrollments, courses] = await Promise.all([
            getAdminCourseEnrollments(),
            getAdminCourses()
        ]);

        return (
            <ContentLayout variant="wide" className="pt-6">
                <AdminAcademyStudentsView enrollments={enrollments} courses={courses} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar alumnos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
