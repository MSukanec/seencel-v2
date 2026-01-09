"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { ContactsList } from "./contacts-list";
import { ContactsSettings } from "./contacts-settings";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Users, UserCheck, Building2 } from "lucide-react";

import { ContactTypesManager } from "./ContactTypesManager";

interface ContactsClientProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    initialTypes: ContactType[];
    summary: {
        total_contacts: number;
        linked_contacts: number;
        member_contacts: number;
    };
}

export function ContactsClient({ organizationId, initialContacts, initialTypes, summary }: ContactsClientProps) {
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
                    <TabsContent value="list" className="m-0 h-full border-none p-0 outline-none space-y-6">
                        {/* KPI Section */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <KpiCard
                                title="Total Contactos"
                                value={summary.total_contacts}
                                icon={Users}
                                iconColor="text-blue-500"
                                description="Contactos activos en tu organización"
                            />
                            <KpiCard
                                title="Con Cuenta Vinculada"
                                value={summary.linked_contacts}
                                icon={UserCheck}
                                iconColor="text-emerald-500"
                                description="Conectados a un usuario de Seencel"
                            />
                            <KpiCard
                                title="Miembros del Equipo"
                                value={summary.member_contacts}
                                icon={Building2}
                                iconColor="text-violet-500"
                                description="Forman parte de tu organización"
                            />
                        </div>

                        {/* Contacts Table */}
                        <ContactsList
                            organizationId={organizationId}
                            initialContacts={initialContacts}
                            contactTypes={initialTypes}
                        />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 h-full border-none p-0 outline-none space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
                            <p className="text-muted-foreground">
                                Administra las preferencias y elementos de tus contactos.
                            </p>
                        </div>
                        <ContactTypesManager
                            organizationId={organizationId}
                            initialTypes={initialTypes}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
