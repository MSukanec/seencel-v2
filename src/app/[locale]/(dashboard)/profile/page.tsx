import type { Metadata } from "next";
import { getUserProfile } from "@/features/users/queries";
import { getCountries } from "@/features/countries/queries";
import { ProfileInfoView } from "@/features/users/views/profile-info-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Perfil | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfilePage() {
    try {
        const [profileData, countries] = await Promise.all([
            getUserProfile(),
            getCountries(),
        ]);

        const { profile } = profileData;

        return <ProfileInfoView profile={profile} countries={countries} />;
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
