import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile, checkIsAdmin } from "@/features/users/queries";
import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";
import { PlansComparison } from "@/features/billing/components/plans-comparison";
import { PricingFaq } from "@/features/billing/components/pricing-faq";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Planes y Precios | Seencel',
    description: 'Elegí el plan perfecto para tu empresa constructora. Desde emprendedores hasta grandes equipos, tenemos la solución ideal.',
    openGraph: {
        title: 'Planes y Precios | Seencel',
        description: 'Elegí el plan perfecto para tu empresa constructora.',
        url: 'https://seencel.com/es/precios',
        images: [{ url: 'https://seencel.com/og-image.jpg', width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
};

export default async function PricingPage() {
    const { profile } = await getUserProfile();
    const [plans, purchaseFlags, currentPlanId, isAdmin] = await Promise.all([
        getPlans(),
        getPlanPurchaseFlags(),
        getCurrentOrganizationPlanId(),
        checkIsAdmin(),
    ]);

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1 pt-20">
                <PlansComparison
                    plans={plans}
                    purchaseFlags={purchaseFlags}
                    currentPlanId={currentPlanId}
                    isAdmin={isAdmin}
                />
                <PricingFaq />
            </main>
            <Footer />
        </div>
    );
}
