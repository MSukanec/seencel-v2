import { ContactsList } from "@/features/contact/components/contacts-list";
import { ContactWithRelations, ContactType } from "@/types/contact";


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
            {/* Contacts Table */}
            <ContactsList
                organizationId={organizationId}
                initialContacts={initialContacts}
                contactTypes={contactTypes}
            />
        </div>
    );
}
