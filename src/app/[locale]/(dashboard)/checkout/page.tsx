import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPlans } from "@/actions/plans";
import { getFeatureFlag, getPlanPurchaseFlags, getPaymentMethodFlags } from "@/actions/feature-flags";
import { getCountries } from "@/features/countries/queries";
import { getCourseBySlug } from "@/features/academy/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getExchangeRate, getUserCountryCode, getUpgradeProration } from "@/features/billing/queries";
import { checkIsAdmin } from "@/features/users/queries";
import { getOrganizationSeatStatus } from "@/features/team/actions";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ShoppingCart } from "lucide-react";
import { BillingCheckoutView } from "@/features/billing/views/billing-checkout-view";
import type { CheckoutSeats, CheckoutUpgrade } from "@/features/billing/types/checkout";

// Metadata
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Founders.checkout' });
    return {
        title: `${t('title')} | Seencel`,
        robots: "noindex, nofollow",
    };
}

interface CheckoutPageProps {
    searchParams: Promise<{
        product?: string;
        cycle?: string;
        // Seats params
        type?: string;
        org?: string;
        quantity?: string;
        // Upgrade params
        target?: string;
    }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const params = await searchParams;
    const productParam = params.product || "";

    // Determine product type from URL parameters
    const isUpgrade = params.type === "upgrade";
    const isSeats = params.type === "seats";
    const isCourse = productParam.startsWith("course-");
    const isPlan = productParam.startsWith("plan-") || (!isCourse && !isSeats && !isUpgrade);

    // Check feature flag for course purchases (pass to view instead of redirect)
    const coursePurchasesEnabled = isCourse
        ? await getFeatureFlag("course_purchases_enabled")
        : true;

    // Extract slug from product parameter
    const productSlug = isCourse
        ? productParam.replace("course-", "")
        : isPlan
            ? productParam.replace("plan-", "")
            : productParam;

    // Fetch seat data if type=seats
    let seatsData: CheckoutSeats | null = null;
    if (isSeats && params.org) {
        const seatResult = await getOrganizationSeatStatus(params.org);
        if (seatResult.success && seatResult.data) {
            const s = seatResult.data;
            seatsData = {
                organizationId: params.org,
                quantity: parseInt(params.quantity || "1", 10),
                proratedPricePerSeat: (s.billing_period === 'monthly'
                    ? s.prorated_monthly
                    : s.prorated_annual) ?? 0,
                daysRemaining: s.days_remaining,
                expiresAt: s.expires_at || new Date().toISOString(),
                billingPeriod: s.billing_period || "annual",
                basePricePerSeat: s.billing_period === "monthly" ? s.seat_price_monthly : s.seat_price_annual,
            };
        }
    }

    // Fetch upgrade proration data if type=upgrade
    let upgradeData: CheckoutUpgrade | null = null;
    if (isUpgrade && params.org && params.target) {
        // First find the target plan ID from slug
        const allPlans = await getPlans();
        const targetPlan = allPlans.find(p => p.slug === params.target);
        if (targetPlan) {
            const prorationResult = await getUpgradeProration(params.org, targetPlan.id);
            if (prorationResult.ok) {
                upgradeData = {
                    organizationId: params.org,
                    currentPlanId: prorationResult.current_plan_id!,
                    currentPlanSlug: prorationResult.current_plan_slug!,
                    currentPlanName: prorationResult.current_plan_name!,
                    targetPlanId: prorationResult.target_plan_id!,
                    targetPlanSlug: prorationResult.target_plan_slug!,
                    targetPlanName: prorationResult.target_plan_name!,
                    billingPeriod: (prorationResult.billing_period as "monthly" | "annual") || "annual",
                    credit: prorationResult.credit!,
                    targetPrice: prorationResult.target_price!,
                    upgradePrice: prorationResult.upgrade_price!,
                    daysRemaining: prorationResult.days_remaining!,
                    expiresAt: prorationResult.expires_at || new Date().toISOString(),
                    subscriptionAmount: prorationResult.subscription_amount!,
                };
            }
        }
    }

    // Fetch data based on product type
    const [plans, countries, course, userOrgs, exchangeRate, userCountryCode, purchaseFlags, paymentMethodFlags, isAdmin] = await Promise.all([
        getPlans(),
        getCountries(),
        isCourse ? getCourseBySlug(productSlug) : Promise.resolve(null),
        getUserOrganizations(),
        getExchangeRate("USD", "ARS"),
        getUserCountryCode(),
        getPlanPurchaseFlags(),
        getPaymentMethodFlags(),
        checkIsAdmin()
    ]);

    // Parse cycle parameter
    const cycle = params.cycle === "monthly" ? "monthly" : params.cycle === "one-time" ? "one-time" : "annual";

    // Determine product type
    const productType = isUpgrade ? "upgrade" : isSeats ? "seats" : isCourse ? "course" : "plan";

    return (
        <PageWrapper
            type="page"
            title="Checkout"
            icon={<ShoppingCart className="h-5 w-5" />}
        >
            <ContentLayout variant="wide">
                <BillingCheckoutView
                    productType={productType}
                    plans={plans}
                    course={course}
                    seatsData={seatsData}
                    upgradeData={upgradeData}
                    initialPlanSlug={isUpgrade ? (upgradeData?.targetPlanSlug || params.target) : productSlug}
                    initialCycle={isUpgrade ? upgradeData?.billingPeriod : (cycle as "monthly" | "annual")}
                    countries={countries}
                    organizationId={isUpgrade ? params.org : (isSeats ? params.org : (userOrgs.activeOrgId || undefined))}
                    exchangeRate={exchangeRate}
                    userCountryCode={userCountryCode}
                    purchaseFlags={purchaseFlags}
                    paymentMethodFlags={paymentMethodFlags}
                    isAdmin={isAdmin}
                    coursePurchasesEnabled={coursePurchasesEnabled}
                />
            </ContentLayout>
        </PageWrapper>
    );
}

