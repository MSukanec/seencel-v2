"use client";

import { TabsContent } from "@/components/ui/tabs";
import { ContactsList } from "./contacts-list";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Users, UserCheck, Building2 } from "lucide-react";
import { ContactTypesManager } from "./contact-types-manager";

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
                        <DashboardKpiCard
                            title="Total Contactos"
                            value={summary.total_contacts}
                            icon={<Users className="w-5 h-5" />}
                            description="Contactos activos en tu organización"
                        />
                        <DashboardKpiCard
                            title="Con Cuenta Vinculada"
                            value={summary.linked_contacts}
                            icon={<UserCheck className="w-5 h-5" />}
                            description="Conectados a un usuario de Seencel"
                        />
                        <DashboardKpiCard
                            title="Miembros del Equipo"
                            value={summary.member_contacts}
                            icon={<Building2 className="w-5 h-5" />}
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
