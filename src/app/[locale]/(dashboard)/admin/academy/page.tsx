import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCoursesDashboardData } from "@/features/admin/academy-queries";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { AdminAcademyDashboardView } from "@/features/admin/academy/views";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Admin.academy' });
    return {
        title: `Visión General | Academia | Seencel Admin`,
        description: "Dashboard de Academia",
        robots: "noindex, nofollow",
    };
}

export default async function AdminAcademyDashboardPage() {
    try {
        const dashboardData = await getCoursesDashboardData();

        return (
            <ContentLayout variant="wide" className="pt-6">
                <AdminAcademyDashboardView data={dashboardData} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el dashboard"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
