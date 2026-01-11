import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";
import { PlansComparison } from "@/components/global/plans-comparison";
import { PricingFaq } from "@/components/global/pricing-faq";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";

export default async function BillingPlansPage() {
    const [plans, purchaseFlags, currentPlanId] = await Promise.all([
        getPlans(),
        getPlanPurchaseFlags(),
        getCurrentOrganizationPlanId(),
    ]);

    return (
        <div className="container py-8">
            <PlansComparison
                plans={plans}
                isDashboard
                purchaseFlags={purchaseFlags}
                currentPlanId={currentPlanId}
            />
            <PricingFaq />
        </div>
    );
}
