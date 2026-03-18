import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getInstructors } from "@/features/academy/actions";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { AdminAcademyInstructorsView } from "@/features/admin/academy/views";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Admin.academy' });
    return {
        title: `Instructores | Academia | Seencel Admin`,
        description: "Gestión de instructores",
        robots: "noindex, nofollow",
    };
}

export default async function AdminAcademyInstructorsPage() {
    try {
        const instructors = await getInstructors();

        return (
            <ContentLayout variant="wide" className="pt-6">
                <AdminAcademyInstructorsView instructors={instructors} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar instructores"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
