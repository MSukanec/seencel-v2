import { ContactsList } from "@/features/contact/components/contacts-list";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Users, UserCheck } from "lucide-react";

interface ContactsListViewProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactTypes: ContactType[];
    summary: {
        total_contacts: number;
        linked_contacts: number;
        member_contacts: number;
    };
}

export function ContactsListView({ organizationId, initialContacts, contactTypes, summary }: ContactsListViewProps) {
    return (
        <div className="space-y-6">
            {/* KPI Section */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Contacts Table */}
            <ContactsList
                organizationId={organizationId}
                initialContacts={initialContacts}
                contactTypes={contactTypes}
            />
        </div>
    );
}
