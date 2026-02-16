import { Metadata } from "next";
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FileText, Settings } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getSiteLogTypes, getSiteLogsForOrganization } from "@/features/sitelog/actions";
import { SitelogEntriesView } from "@/features/sitelog/views/sitelog-entries-view";
import { SitelogSettingsView } from "@/features/sitelog/views/sitelog-settings-view";

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

const tabTriggerClass =
    "relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-3 pb-3 pt-2 font-semibold " +
    "text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary " +
    "data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

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
            <Tabs defaultValue="entries" className="w-full h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Bitácora de Obra"
                    icon={<FileText />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="entries" className={`${tabTriggerClass} gap-2`}>
                                <FileText className="h-4 w-4" />
                                Entradas
                            </TabsTrigger>
                            <TabsTrigger value="settings" className={`${tabTriggerClass} gap-2`}>
                                <Settings className="h-4 w-4" />
                                Ajustes
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <ContentLayout variant="wide" className="[scrollbar-gutter:stable]">
                        <TabsContent value="entries" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden space-y-6">
                            <SitelogEntriesView
                                organizationId={organizationId}
                                initialLogs={logs}
                                initialTypes={types}
                            />
                        </TabsContent>
                        <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <SitelogSettingsView
                                organizationId={organizationId}
                                initialTypes={types}
                            />
                        </TabsContent>
                    </ContentLayout>
                </PageWrapper>
            </Tabs>
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
