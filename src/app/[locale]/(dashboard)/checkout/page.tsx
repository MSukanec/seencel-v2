import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPlans } from "@/actions/plans";
import { getFeatureFlag, getPlanPurchaseFlags, getPaymentMethodFlags } from "@/actions/feature-flags";
import { getCountries } from "@/features/countries/queries";
import { getCourseBySlug } from "@/features/academy/course-queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getExchangeRate, getUserCountryCode } from "@/features/billing/queries";
import { checkIsAdmin } from "@/features/users/queries";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ShoppingCart } from "lucide-react";
import { CheckoutView } from "@/features/billing/views/checkout-view";

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
    }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const params = await searchParams;
    const productParam = params.product || "";

    // Determine product type from URL parameter
    const isCourse = productParam.startsWith("course-");
    const isPlan = productParam.startsWith("plan-");

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

    return (
        <PageWrapper
            type="page"
            title="Checkout"
            icon={<ShoppingCart className="h-5 w-5" />}
        >
            <ContentLayout variant="wide">
                <CheckoutView
                    productType={isCourse ? "course" : "plan"}
                    plans={plans}
                    course={course}
                    initialPlanSlug={productSlug}
                    initialCycle={cycle as "monthly" | "annual"}
                    countries={countries}
                    organizationId={userOrgs.activeOrgId || undefined}
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

