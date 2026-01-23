import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/profile/queries";
import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";
import { PlansComparison } from "@/features/billing/components/plans-comparison";
import { PricingFaq } from "@/features/billing/components/pricing-faq";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";

export default async function PricingPage() {
    const { profile } = await getUserProfile();
    const [plans, purchaseFlags, currentPlanId] = await Promise.all([
        getPlans(),
        getPlanPurchaseFlags(),
        getCurrentOrganizationPlanId(),
    ]);

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1">
                <PlansComparison
                    plans={plans}
                    purchaseFlags={purchaseFlags}
                    currentPlanId={currentPlanId}
                />
                <PricingFaq />
            </main>
            <Footer />
        </div>
    );
}
