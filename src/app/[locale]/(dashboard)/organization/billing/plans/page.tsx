import { getPlans, getCurrentOrganizationPlanId, isOrganizationFounder } from "@/actions/plans";
import { ContentLayout } from "@/components/layout";
import { PlansComparison } from "@/features/billing/components/plans-comparison";
import { PricingFaq } from "@/features/billing/components/pricing-faq";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";
import { checkIsAdmin } from "@/features/users/queries";
import { Star, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function BillingPlansPage() {
    const [plans, purchaseFlags, currentPlanId, isAdmin, isFounder] = await Promise.all([
        getPlans(),
        getPlanPurchaseFlags(),
        getCurrentOrganizationPlanId(),
        checkIsAdmin(),
        isOrganizationFounder(),
    ]);

    return (
        <ContentLayout variant="wide">
            <div className="w-full flex flex-col items-center py-8">
                {/* Founder Banner */}
                {isFounder && (
                    <div className="w-full max-w-4xl mb-8 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 p-6">
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
                                    href="/organization/billing/founders"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors"
                                >
                                    Ver mis beneficios de fundador
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <PlansComparison
                    plans={plans}
                    isDashboard
                    purchaseFlags={purchaseFlags}
                    currentPlanId={currentPlanId}
                    isAdmin={isAdmin}
                />
                <PricingFaq />
            </div>
        </ContentLayout>
    );
}

