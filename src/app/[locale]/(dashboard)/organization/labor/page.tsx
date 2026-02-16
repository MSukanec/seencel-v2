import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HardHat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

import { LaborOverviewView } from "@/features/labor/views/labor-overview-view";
import { LaborTeamView } from "@/features/labor/views/labor-team-view";
import { LaborPaymentsView } from "@/features/labor/views/labor-payments-view";
import { LaborCatalogView } from "@/features/labor/views/labor-catalog-view";
import { LaborSettingsView } from "@/features/labor/views/labor-settings-view";

import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { getLaborPaymentsByOrg, getLaborTypes, getOrgLaborView, getLaborCategories } from "@/features/labor/actions";
import { getOrganizationContacts } from "@/features/clients/queries";
import { getSystemLaborLevels, getSystemLaborRoles, getSystemLaborTypes, getUnitsForLabor } from "@/features/admin/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    return {
        title: `Mano de Obra | SEENCEL`,
        description: "Gestión de mano de obra, pagos y equipo",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component (Pattern A: Server → Views directas)
// ============================================================================

export default async function OrganizationLaborPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const resolvedSearchParams = await searchParams;
        const defaultTab = resolvedSearchParams.view || "overview";

        const { activeOrgId } = await getUserOrganizations();

        if (!activeOrgId) {
            redirect("/");
        }

        // Fetch ALL org data in parallel (no project filter)
        const [
            payments,
            laborTypes,
            workers,
            financialData,
            contactsResult,
            catalogCategories,
            catalogLevels,
            catalogRoles,
            catalogTypes,
            catalogUnits,
        ] = await Promise.all([
            getLaborPaymentsByOrg(activeOrgId),
            getLaborTypes(),
            getOrgLaborView(activeOrgId),
            getOrganizationFinancialData(activeOrgId),
            getOrganizationContacts(activeOrgId),
            getLaborCategories(activeOrgId),
            getSystemLaborLevels(),
            getSystemLaborRoles(),
            getSystemLaborTypes(),
            getUnitsForLabor(),
        ]);

        // Format contacts for the form combobox
        const contacts = (contactsResult.data || []).map(contact => ({
            id: contact.id,
            name: contact.full_name || "Sin Nombre",
            image: contact.image_url,
            fallback: (contact.full_name || "?").slice(0, 2).toUpperCase(),
        }));

        // Check if catalog data is available
        const hasCatalogData = (catalogCategories as any[]).length > 0 || (catalogLevels as any[]).length > 0 || (catalogRoles as any[]).length > 0 || (catalogTypes as any[]).length > 0;

        return (
            <Tabs defaultValue={defaultTab} syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Mano de Obra"
                    icon={<HardHat />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="team">Equipo</TabsTrigger>
                            <TabsTrigger value="payments">Pagos</TabsTrigger>
                            {hasCatalogData && (
                                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                            )}
                            <TabsTrigger value="settings">Ajustes</TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="overview" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <LaborOverviewView orgId={activeOrgId} payments={payments} />
                    </TabsContent>

                    <TabsContent value="team" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <LaborTeamView
                            orgId={activeOrgId}
                            workers={workers}
                            laborTypes={laborTypes}
                            contacts={contacts}
                        />
                    </TabsContent>

                    <TabsContent value="payments" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <LaborPaymentsView
                            orgId={activeOrgId}
                            payments={payments}
                            laborTypes={laborTypes}
                            workers={workers}
                            wallets={financialData.wallets}
                            currencies={financialData.currencies}
                        />
                    </TabsContent>

                    {hasCatalogData && (
                        <TabsContent value="catalog" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <LaborCatalogView
                                laborCategories={catalogCategories as any}
                                laborLevels={catalogLevels as any}
                                laborRoles={catalogRoles as any}
                                laborTypes={catalogTypes as any}
                                units={catalogUnits as any}
                                isAdminMode={false}
                            />
                        </TabsContent>
                    )}

                    <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <LaborSettingsView
                            orgId={activeOrgId}
                            laborTypes={catalogCategories as any}
                        />
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar mano de obra"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
