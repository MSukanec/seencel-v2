import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { getUserTimezone } from "@/features/users/queries";
import { PreferencesView } from "@/features/users/views/profile-preferences-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Preferencias | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfilePreferencesPage() {
    try {
        const userTimezone = await getUserTimezone();

        return (
            <ContentLayout variant="narrow">
                <PreferencesView initialTimezone={userTimezone} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar preferencias"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
