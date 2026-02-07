import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile, checkIsAdmin } from "@/features/users/queries";
import { getPlans, getCurrentOrganizationPlanId, isOrganizationFounder } from "@/actions/plans";
import { PlansComparison } from "@/features/billing/components/plans-comparison";
import { PricingFaq } from "@/features/billing/components/pricing-faq";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";
import { Star, Crown, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
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
    const [plans, purchaseFlags, currentPlanId, isAdmin, isFounder] = await Promise.all([
        getPlans(),
        getPlanPurchaseFlags(),
        getCurrentOrganizationPlanId(),
        checkIsAdmin(),
        isOrganizationFounder(),
    ]);

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1 pt-20">
                {/* Founder Banner */}
                {isFounder && (
                    <div className="max-w-4xl mx-auto mb-8 px-4">
                        <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 p-6">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                    <Crown className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            Organización Fundadora
                                        </h3>
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        ¡Gracias por ser parte de los primeros en confiar en Seencel!
                                        Disfrutá de beneficios exclusivos de por vida, incluyendo acceso anticipado a nuevas funciones.
                                    </p>
                                    <Link
                                        href="/founders"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors"
                                    >
                                        Ver mis beneficios de fundador
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
