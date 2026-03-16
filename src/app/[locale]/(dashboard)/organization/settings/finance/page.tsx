import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FinancesSettingsView } from "@/features/finance/views/finances-settings-view";
import { ContentLayout } from "@/components/layout";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ajustes Financieros | Seencel",
        description: "Configuración financiera de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function FinancePage() {
    try {
        const { orgId } = await requireAuthContext();
        const settingsData = await getOrganizationSettingsData(orgId);

        return (
            <ContentLayout variant="settings">
                <FinancesSettingsView
                    organizationId={orgId}
                    preferences={settingsData.preferences}
                    orgCurrencies={settingsData.contactCurrencies}
                    orgWallets={settingsData.contactWallets}
                    availableCurrencies={settingsData.availableCurrencies}
                    availableWallets={settingsData.availableWallets}
                    subscription={settingsData.subscription}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar configuración financiera"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
