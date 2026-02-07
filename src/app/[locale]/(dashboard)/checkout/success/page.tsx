import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BillingCheckoutSuccessView } from "@/features/billing/views/billing-checkout-success-view";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Founders.checkout' });
    return {
        title: `${t('title')} - ¡Éxito! | Seencel`,
        description: "Tu compra fue procesada exitosamente.",
        robots: "noindex, nofollow",
    };
}

export default function CheckoutSuccessPage() {
    return <BillingCheckoutSuccessView />;
}
