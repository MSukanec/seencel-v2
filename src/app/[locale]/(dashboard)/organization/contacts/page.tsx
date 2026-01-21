import { getActiveOrganizationId } from "@/actions/general-costs";
import { getContactTypes, getOrganizationContacts, getContactsSummary } from "@/actions/contacts";
import { ContactsClient } from "@/features/organization/components/contacts/contacts-client";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function ContactsPage() {
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        redirect('/');
    }

    const [contacts, types, summary] = await Promise.all([
        getOrganizationContacts(organizationId),
        getContactTypes(organizationId),
        getContactsSummary(organizationId)
    ]);

    return (
        <Tabs defaultValue="list" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Contactos"
                icon={<Users />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="list" className={tabTriggerClass}>
                            Lista de Contactos
                        </TabsTrigger>
                        <TabsTrigger value="settings" className={tabTriggerClass}>
                            Configuración
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <ContentLayout variant="wide">
                    <ContactsClient
                        organizationId={organizationId}
                        initialContacts={contacts}
                        initialTypes={types}
                        summary={summary}
                    />
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
