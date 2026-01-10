import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getUserProfile } from "@/features/profile/queries";
import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";
import { PlansComparison } from "@/components/global/plans-comparison";
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
            </main>
            <Footer />
        </div>
    );
}
