import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";
import { ContentLayout } from "@/components/layout";
import { PlansComparison } from "@/features/billing/components/plans-comparison";
import { PricingFaq } from "@/features/billing/components/pricing-faq";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";

export default async function BillingPlansPage() {
    const [plans, purchaseFlags, currentPlanId] = await Promise.all([
        getPlans(),
        getPlanPurchaseFlags(),
        getCurrentOrganizationPlanId(),
    ]);

    return (
        <ContentLayout variant="wide">
            <div className="w-full flex flex-col items-center py-8">
                <PlansComparison
                    plans={plans}
                    isDashboard
                    purchaseFlags={purchaseFlags}
                    currentPlanId={currentPlanId}
                />
                <PricingFaq />
            </div>
        </ContentLayout>
    );
}
