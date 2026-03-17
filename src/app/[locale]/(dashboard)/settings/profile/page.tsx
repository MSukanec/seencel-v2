import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { getCountries } from "@/features/countries/queries";
import { getBillingProfile } from "@/features/billing/queries";
import { ProfileInfoView } from "@/features/users/views/profile-info-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Perfil | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfilePage() {
    try {
        const [profileData, countries, billingData] = await Promise.all([
            getUserProfile(),
            getCountries(),
            getBillingProfile(),
        ]);

        const { profile } = profileData;
        const { profile: billingProfile } = billingData;

        return (
            <ContentLayout variant="narrow">
                <ProfileInfoView
                    profile={profile}
                    countries={countries}
                    billingProfile={billingProfile}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar perfil"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
