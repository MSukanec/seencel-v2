import { getPlans } from "@/actions/plans";
import { CheckoutContent } from "@/components/checkout/checkout-content";

interface CheckoutPageProps {
    searchParams: Promise<{
        product?: string;
        cycle?: string;
    }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const params = await searchParams;
    const plans = await getPlans();

    // Parse product parameter (e.g., "plan-pro" -> "pro")
    const productParam = params.product || "";
    const planSlug = productParam.startsWith("plan-")
        ? productParam.replace("plan-", "")
        : productParam;

    // Parse cycle parameter
    const cycle = params.cycle === "monthly" ? "monthly" : "annual";

    return (
        <CheckoutContent
            plans={plans}
            initialPlanSlug={planSlug}
            initialCycle={cycle}
        />
    );
}
