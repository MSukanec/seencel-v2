import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BillingCheckoutPendingView } from "@/features/billing/views/billing-checkout-pending-view";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Founders.checkout' });
    return {
        title: `${t('title')} - Pendiente | Seencel`,
        description: "Tu pago está siendo procesado.",
        robots: "noindex, nofollow",
    };
}

export default function CheckoutPendingPage() {
    return <BillingCheckoutPendingView />;
}
