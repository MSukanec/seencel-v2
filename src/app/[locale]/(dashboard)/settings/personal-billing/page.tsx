import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { getBillingProfile } from "@/features/billing/queries";
import { getCountries } from "@/features/countries/queries";
import { ProfileBillingView } from "@/features/users/views/profile-billing-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Facturación | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfileBillingPage() {
    try {
        const [billingData, countries] = await Promise.all([
            getBillingProfile(),
            getCountries(),
        ]);

        const { profile: billingProfile } = billingData;

        return (
            <ContentLayout variant="narrow">
                <ProfileBillingView billingProfile={billingProfile} countries={countries} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar facturación"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
