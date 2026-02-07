import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BillingCheckoutFailureView } from "@/features/billing/views/billing-checkout-failure-view";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Founders.checkout' });
    return {
        title: `${t('title')} - Error | Seencel`,
        description: "Hubo un problema con tu pago.",
        robots: "noindex, nofollow",
    };
}

export default function CheckoutFailurePage() {
    return <BillingCheckoutFailureView />;
}
