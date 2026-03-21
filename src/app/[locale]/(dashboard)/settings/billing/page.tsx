import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getPlans } from "@/actions/plans";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";
import { checkIsAdmin } from "@/features/users/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BillingSettingsView } from "@/features/billing/views/billing-settings-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Planes y Facturación | Seencel",
        description: "Facturación y planes de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function BillingPage() {
    try {
        const { orgId } = await requireAuthContext();

        const [data, plans, purchaseFlags, isAdmin] = await Promise.all([
            getOrganizationSettingsData(orgId),
            getPlans(),
            getPlanPurchaseFlags(),
            checkIsAdmin(),
        ]);

        return (
            <ContentLayout variant="wide">
                <BillingSettingsView
                    subscription={data.subscription}
                    billingCycles={data.billingCycles}
                    organizationId={orgId}
                    plans={plans}
                    purchaseFlags={purchaseFlags}
                    isAdmin={isAdmin}
                    currentPlanId={data.subscription?.plan_id ?? null}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar facturación"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
