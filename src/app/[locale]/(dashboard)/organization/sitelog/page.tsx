import { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { requireAuthContext } from "@/lib/auth";
import { getSiteLogTypes, getSiteLogsForOrganization } from "@/features/sitelog/actions";
import { SitelogEntriesView } from "@/features/sitelog/views/sitelog-entries-view";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Bitácora de Obra | SEENCEL",
        robots: "noindex, nofollow",
    };
}

export default async function SitelogEntriesPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const { orgId: organizationId } = await requireAuthContext();
        if (!organizationId) return null;

        const [types, logs] = await Promise.all([
            getSiteLogTypes(organizationId),
            getSiteLogsForOrganization(organizationId),
        ]);

        return (
            <ContentLayout variant="wide">
                <SitelogEntriesView
                    organizationId={organizationId}
                    initialLogs={logs}
                    initialTypes={types}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="wide">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </ContentLayout>
        );
    }
}
