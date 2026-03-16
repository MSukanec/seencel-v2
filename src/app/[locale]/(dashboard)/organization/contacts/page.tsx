import { requireAuthContext } from "@/lib/auth";
import { getContactCategories, getOrganizationContacts } from "@/actions/contacts";
import { getSavedViews } from "@/features/files/queries";
import { createClient } from "@/lib/supabase/server";
import { ContactsListView } from "@/features/contact/views/contacts-list-view";
import { ContentLayout } from "@/components/layout";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { ErrorDisplay } from "@/components/ui/error-display";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({
        locale,
        namespace: 'Contacts'
    });

    return {
        title: `${t('title')} | Seencel`,
        description: t('subtitle'),
        robots: "noindex, nofollow",
    };
}

export default async function ContactsPage() {
    const { orgId: organizationId } = await requireAuthContext();

    const t = await getTranslations('Contacts');

    try {
        const [contacts, categories, orgResult, savedViews] = await Promise.all([
            getOrganizationContacts(organizationId),
            getContactCategories(organizationId),
            (await createClient()).schema('iam').from('organizations').select('name, logo_url').eq('id', organizationId).single(),
            getSavedViews(organizationId, 'contacts'),
        ]);

        const organizationName = orgResult.data?.name || '';
        const organizationLogoUrl = orgResult.data?.logo_url || null;

        return (
            <ContentLayout variant="wide">
                <ContactsListView
                    organizationId={organizationId}
                    initialContacts={contacts}
                    contactCategories={categories}
                    organizationName={organizationName}
                    organizationLogoUrl={organizationLogoUrl}
                    savedViews={savedViews}
                />
            </ContentLayout>
        );
    } catch (error) {
        console.error("Error loading contacts:", error);
        return (
            <ContentLayout variant="wide">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title={t('errors.title')}
                        message={error instanceof Error ? error.message : "Unknown error"}
                        retryLabel={t('errors.retry')}
                    />
                </div>
            </ContentLayout>
        );
    }
}
