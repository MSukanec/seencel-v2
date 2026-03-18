import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminCourses } from "@/features/admin/academy-queries";
import { getInstructors } from "@/features/academy/actions";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { AdminAcademyCoursesView } from "@/features/admin/academy/views";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Admin.academy' });
    return {
        title: `Cursos | Academia | Seencel Admin`,
        description: "Gestión de cursos",
        robots: "noindex, nofollow",
    };
}

export default async function AdminAcademyCoursesPage() {
    try {
        const [courses, instructors] = await Promise.all([
            getAdminCourses(),
            getInstructors()
        ]);

        return (
            <ContentLayout variant="wide" className="pt-6">
                <AdminAcademyCoursesView courses={courses} instructors={instructors} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar cursos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
