import { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { requireAuthContext } from "@/lib/auth";
import { getSiteLogTypes } from "@/features/sitelog/actions";
import { SitelogSettingsView } from "@/features/sitelog/views/sitelog-settings-view";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ajustes de Bitácora | SEENCEL",
        robots: "noindex, nofollow",
    };
}

export default async function SitelogSettingsPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const { orgId: organizationId } = await requireAuthContext();
        if (!organizationId) return null;

        const types = await getSiteLogTypes(organizationId);

        return (
            <ContentLayout variant="narrow">
                <SitelogSettingsView
                    organizationId={organizationId}
                    initialTypes={types}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="narrow">
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
