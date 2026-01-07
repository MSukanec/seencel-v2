"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { ContactsList } from "./contacts-list";
import { ContactsSettings } from "./contacts-settings";
import { ContactWithRelations, ContactType } from "@/types/contact";

interface ContactsClientProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    initialTypes: ContactType[];
}

export function ContactsClient({ organizationId, initialContacts, initialTypes }: ContactsClientProps) {
    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title="Contactos" />

            <Tabs defaultValue="list" className="flex flex-col h-full">
                <HeaderPortal>
                    <TabsList className="bg-transparent border-b rounded-none h-12 w-full justify-start p-0 space-x-6">
                        <TabsTrigger
                            value="list"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Lista de Contactos
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Configuración
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                <div className="flex-1 w-full p-6">
                    <TabsContent value="list" className="m-0 h-full border-none p-0 outline-none">
                        <ContactsList
                            organizationId={organizationId}
                            initialContacts={initialContacts}
                            contactTypes={initialTypes}
                        />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 h-full border-none p-0 outline-none">
                        <ContactsSettings
                            organizationId={organizationId}
                            initialTypes={initialTypes}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
