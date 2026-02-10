import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { cn } from "@/lib/utils";
import { getContactTypes, getOrganizationContacts, getContactsSummary } from "@/actions/contacts";
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
    params: { locale: string }
}): Promise<Metadata> {
    const t = await getTranslations({
        locale: params.locale,
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
        const [contacts, types, summary] = await Promise.all([
            getOrganizationContacts(organizationId),
            getContactTypes(organizationId),
            getContactsSummary(organizationId)
        ]);

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
                    <TabsContent value="list" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <ContactsListView
                                organizationId={organizationId}
                                initialContacts={contacts}
                                contactTypes={types}
                                summary={summary}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <ContactsSettingsView
                                organizationId={organizationId}
                                initialTypes={types}
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
