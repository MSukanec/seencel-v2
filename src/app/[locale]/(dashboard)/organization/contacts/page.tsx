import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getContactCategories, getOrganizationContacts } from "@/actions/contacts";
import { createClient } from "@/lib/supabase/server";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs";
import { ContactsListView } from "@/features/contact/views/contacts-list-view";
import { ContactsSettingsView } from "@/features/contact/views/contacts-settings-view";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
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
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        redirect('/');
    }

    const t = await getTranslations('Contacts');

    try {
        const supabase = await createClient();
        const [contacts, categories, orgResult] = await Promise.all([
            getOrganizationContacts(organizationId),
            getContactCategories(organizationId),
            supabase.schema('iam').from('organizations').select('name, logo_url').eq('id', organizationId).single(),
        ]);

        const organizationName = orgResult.data?.name || '';
        const organizationLogoUrl = orgResult.data?.logo_url || null;

        return (
            <Tabs defaultValue="list" syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={t('title')}
                    icon={<Users />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="list">
                                {t('tabs.list')}
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                {t('tabs.settings')}
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="list" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <ContactsListView
                                organizationId={organizationId}
                                initialContacts={contacts}
                                contactCategories={categories}
                                organizationName={organizationName}
                                organizationLogoUrl={organizationLogoUrl}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <ContactsSettingsView
                                organizationId={organizationId}
                                initialCategories={categories}
                            />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        console.error("Error loading contacts:", error);
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title={t('errors.title')}
                    message={error instanceof Error ? error.message : "Unknown error"}
                    retryLabel={t('errors.retry')}
                />
            </div>
        );
    }
}
