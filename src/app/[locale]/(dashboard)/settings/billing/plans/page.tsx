import type { Metadata } from "next";
import { ContentLayout, PageIntro } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";
import { getPlans, getCurrentOrganizationInfo } from "@/actions/plans";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";
import { checkIsAdmin } from "@/features/users/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PlansComparison } from "@/features/billing/components/plans-comparison";
import { PricingFaq } from "@/features/billing/components/pricing-faq";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
    title: "Todos los Planes | Seencel",
    description: "Comparativa de todos los planes disponibles",
    robots: "noindex, nofollow",
};

export default async function BillingPlansPage() {
    try {
        await requireAuthContext();

        const [plans, purchaseFlags, orgInfo, isAdmin] = await Promise.all([
            getPlans(),
            getPlanPurchaseFlags(),
            getCurrentOrganizationInfo(),
            checkIsAdmin(),
        ]);

        const currentPlanId = orgInfo.planId;
        const organizationId = orgInfo.organizationId;

        return (
            <ContentLayout variant="wide">
                <PageIntro
                    icon={Rocket}
                    title="Todos los Planes"
                    description="Comparativa detallada de todas las características y límites de los planes de Seencel."
                    action={
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/settings/billing">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver a Facturación
                            </Link>
                        </Button>
                    }
                />
                <div className="pb-16 -mt-8">
                    <PlansComparison
                        plans={plans}
                        purchaseFlags={purchaseFlags}
                        currentPlanId={currentPlanId}
                        isAdmin={isAdmin}
                        organizationId={organizationId}
                        isDashboard={true}
                    />
                    <div className="max-w-7xl mx-auto px-4">
                        <PricingFaq />
                    </div>
                </div>
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar planes"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
