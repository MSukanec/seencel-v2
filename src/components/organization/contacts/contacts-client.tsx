"use client";

import { TabsContent } from "@/components/ui/tabs";
import { ContactsList } from "./contacts-list";
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
        <>
            <TabsContent value="list" className="m-0 h-full focus-visible:outline-none">
                <div className="space-y-6">
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
                </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                <div className="space-y-6">
                    <ContactTypesManager
                        organizationId={organizationId}
                        initialTypes={initialTypes}
                    />
                </div>
            </TabsContent>
        </>
    );
}
