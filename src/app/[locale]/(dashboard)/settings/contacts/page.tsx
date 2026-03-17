import { requireAuthContext } from "@/lib/auth";
import { getContactCategories } from "@/actions/contacts";
import { ContactsSettingsView } from "@/features/contact/views/contacts-settings-view";
import { ContentLayout } from "@/components/layout";
import { Metadata } from "next";
import { ErrorDisplay } from "@/components/ui/error-display";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Categorías de Contacto | Seencel",
        robots: "noindex, nofollow",
    };
}

export default async function ContactsCategoriesPage() {
    const { orgId: organizationId } = await requireAuthContext();

    try {
        const categories = await getContactCategories(organizationId);

        return (
            <ContentLayout variant="narrow">
                <ContactsSettingsView
                    organizationId={organizationId}
                    initialCategories={categories}
                />
            </ContentLayout>
        );
    } catch (error) {
        console.error("Error loading contact categories:", error);
        return (
            <ContentLayout variant="narrow">
                <ErrorDisplay
                    title="Error al cargar categorías"
                    message="Ocurrió un error al cargar las categorías de contacto."
                    retryLabel="Reintentar"
                />
            </ContentLayout>
        );
    }
}

