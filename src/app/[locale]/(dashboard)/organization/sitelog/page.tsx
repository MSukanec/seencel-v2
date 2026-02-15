import { Metadata } from "next";
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FileText } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getSiteLogTypes, getSiteLogsForOrganization } from "@/actions/sitelog";
import { SitelogShell } from "@/features/sitelog/components/sitelog-shell";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sitelog' });

    return {
        title: `${t('title')} | SEENCEL`,
        description: t('title'),
        robots: "noindex, nofollow",
    };
}

export default async function OrganizationSitelogPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const organizationId = await getActiveOrganizationId();
        if (!organizationId) return null;

        const [types, logs] = await Promise.all([
            getSiteLogTypes(organizationId),
            getSiteLogsForOrganization(organizationId),
        ]);

        return (
            <SitelogShell
                organizationId={organizationId}
                initialTypes={types}
                initialLogs={logs}
            />
        );
    } catch (error) {
        return (
            <PageWrapper type="page" title="Bitácora de Obra" icon={<FileText />}>
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </PageWrapper>
        );
    }
}
